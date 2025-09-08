import Rn from 'rhodonite';

function draw(expressions) {
  Rn.System.process(expressions);
  requestAnimationFrame(draw.bind(null, expressions));
}


function createPostEffectRenderPass(material, cameraComponent) {
  const boardPrimitive = new Rn.Plane();
  boardPrimitive.generate({
    width: 1,
    height: 1,
    uSpan: 1,
    vSpan: 1,
    isUVRepeat: false,
    material,
  });

  const boardMesh = new Rn.Mesh();
  boardMesh.addPrimitive(boardPrimitive);

  const boardEntity = Rn.createMeshEntity();
  boardEntity.getTransform().localEulerAngles = Rn.Vector3.fromCopyArray([Math.PI / 2, 0.0, 0.0]);
  boardEntity.getTransform().localPosition = Rn.Vector3.fromCopyArray([0.0, 0.0, -0.5]);
  const boardMeshComponent = boardEntity.getMesh();
  boardMeshComponent.setMesh(boardMesh);

  const renderPass = new Rn.RenderPass();
  renderPass.toClearColorBuffer = false;
  renderPass.cameraComponent = cameraComponent;
  renderPass.addEntities([boardEntity]);

  return renderPass;
}

function createPostEffectCameraEntity() {
  const cameraEntity = Rn.createCameraEntity();
  const cameraComponent = cameraEntity.getCamera();
  cameraComponent.zNearInner = 0.5;
  cameraComponent.zFarInner = 2.0;
  return cameraEntity;
}

function createRenderPassSharingEntitiesAndCamera(originalRenderPass) {
  const renderPass = new Rn.RenderPass();
  renderPass.addEntities(originalRenderPass.entities);
  renderPass.cameraComponent = originalRenderPass.cameraComponent;

  return renderPass;
}

function setTextureParameterForMeshComponents(
  meshComponents,
  shaderSemantic,
  value
) {
  const sampler = new Rn.Sampler({
    magFilter: Rn.TextureParameter.Linear,
    minFilter: Rn.TextureParameter.Linear,
    wrapS: Rn.TextureParameter.ClampToEdge,
    wrapT: Rn.TextureParameter.ClampToEdge,
  });
  for (let i = 0; i < meshComponents.length; i++) {
    const mesh = meshComponents[i].mesh;
    if (!mesh) continue;

    const primitiveNumber = mesh.getPrimitiveNumber();
    for (let j = 0; j < primitiveNumber; j++) {
      const primitive = mesh.getPrimitiveAt(j);
      primitive.material.setTextureParameter(shaderSemantic, value, sampler);
    }
  }
}

async function main() {

  const vrmModelRotation = Rn.Vector3.fromCopyArray([0, Math.PI, 0.0]);

  // Get the canvas and set its resolution to match the device's pixel ratio
  const canvas = document.querySelector('#canvas');
  const dpr = window.devicePixelRatio || 1;
  canvas.width = canvas.clientWidth * dpr;
  canvas.height = canvas.clientHeight * dpr;

    const displayResolution = 800;

  await Rn.System.init({
    approach: Rn.ProcessApproach.DataTexture,
    canvas: canvas, // Use the canvas element directly
  });

  const cameraEntity = Rn.createCameraControllerEntity();

  const cameraComponent = cameraEntity.getCamera();
  cameraComponent.zNear = 0.1;
  cameraComponent.zFar = 1000.0;
  cameraComponent.setFovyAndChangeFocalLength(10.0);

  cameraComponent.aspect = canvas.clientWidth / canvas.clientHeight;

  cameraEntity.getTransform().localPosition = Rn.Vector3.fromCopy3(0,0,-3)

  const lightPositions = [
    [0,2,1], [0,-3, 1], [1,0.5,1], [-1,0.5,1]
  ];
  const renderPass = new Rn.RenderPass();
  renderPass.cameraComponent = cameraComponent;

  renderPass.addEntities([cameraEntity]);

  for (const vec of lightPositions) {

    const lightEntity = Rn.createLightEntity();
    const lightComponent = lightEntity.getLight();
    console.log('light intensity:',lightComponent.intensity);
    lightComponent.intensity = 0.6;

    lightComponent.type = Rn.LightType.Directional;
    lightComponent.castShadow = false;
    lightComponent.color = Rn.Vector3.fromCopyArray([0.6, 0.6, 0.6]);
    lightComponent.range = 20;
    
    lightEntity.getTransform().localEulerAngles = Rn.Vector3.fromCopyArray([0,Math.PI/3,Math.PI/5]);
    lightEntity.getTransform().localPosition = Rn.Vector3.fromCopyArray(vec);
    
    renderPass.addEntities([lightEntity]);
  }

  

  const expression = new Rn.Expression();
  expression.addRenderPasses([renderPass]);

  const exp = [expression];

  try {
    // const response = await Rn.Gltf2Importer.importFromUrl('./assets/miyu.vrm', {
    //   cameraComponent: cameraComponent,
    // });
    // const rootGroup = await Rn.ModelConverter.convertToRhodoniteObject(response);
    
    // rootGroup.position = Rn.Vector3.fromCopy3(0, 0, -3);
    // rootGroup.rotation = Rn.Quaternion.fromCopy4(0, 1, 0, 0);

    // renderPass.addEntities([rootGroup]);

    const vrmExpression = await Rn.GltfImporter.importFromUrl('./assets/miyu.vrm', {
        defaultMaterialHelperArgumentArray: [
          {
            isSkinning: false,
            isMorphing: false,
            makeOutputSrgb: false,
          },
        ],
      cameraComponent: cameraComponent,
    });

    exp.push(vrmExpression);
    
    const vrmMainRenderPass = vrmExpression.renderPasses[0];
    const vrmRootEntity = vrmMainRenderPass.sceneTopLevelGraphComponents[0].entity;
    vrmRootEntity.getTransform().localEulerAngles  = vrmModelRotation;
    vrmRootEntity.getTransform().position = Rn.Vector3.fromCopy3(0, 0, -3);

    // post effects
    const expressionPostEffect = new Rn.Expression();
    exp.push(expressionPostEffect);

    // gamma correction
    const gammaTargetFramebuffer = Rn.RenderableHelper.createFrameBuffer({
      width: displayResolution,
      height: displayResolution,
      textureNum: 1,
      textureFormats: [Rn.TextureFormat.RGBA8],
      createDepthBuffer: true,
    });
    // for (const renderPass of vrmExpression.renderPasses) {
    //   renderPass.setFramebuffer(gammaTargetFramebuffer);
    //   renderPass.toClearColorBuffer = false;
    //   renderPass.toClearDepthBuffer = false;
    // }
    // vrmExpression.renderPasses[0].toClearColorBuffer = true;
    // vrmExpression.renderPasses[0].toClearDepthBuffer = true;

    const postEffectCameraEntity = createPostEffectCameraEntity();
    const postEffectCameraComponent = postEffectCameraEntity.getCamera();

    const gammaCorrectionMaterial = Rn.MaterialHelper.createGammaCorrectionMaterial();
    const gammaCorrectionRenderPass = createPostEffectRenderPass(gammaCorrectionMaterial, postEffectCameraComponent);

    setTextureParameterForMeshComponents(
      gammaCorrectionRenderPass.meshComponents,
      'baseColorTexture',
      gammaTargetFramebuffer.getColorAttachedRenderTargetTexture(0)
    );

    // fxaa
    const fxaaTargetFramebuffer = Rn.RenderableHelper.createFrameBuffer({
      width: displayResolution,
      height: displayResolution,
      textureNum: 1,
      textureFormats: [Rn.TextureFormat.RGBA8],
      createDepthBuffer: true,
    });
    gammaCorrectionRenderPass.setFramebuffer(fxaaTargetFramebuffer);

    const fxaaRenderPass = createRenderPassSharingEntitiesAndCamera(gammaCorrectionRenderPass);
    const fxaaMaterial = Rn.MaterialHelper.createFXAA3QualityMaterial();
    fxaaMaterial.setParameter('screenInfo', Rn.Vector2.fromCopyArray2([displayResolution, displayResolution]));
    const sampler = new Rn.Sampler({
      magFilter: Rn.TextureParameter.Linear,
      minFilter: Rn.TextureParameter.Linear,
      wrapS: Rn.TextureParameter.ClampToEdge,
      wrapT: Rn.TextureParameter.ClampToEdge,
      anisotropy: false,
    });
    fxaaMaterial.setTextureParameter(
      'baseColorTexture',
      fxaaTargetFramebuffer.getColorAttachedRenderTargetTexture(0),
      sampler
    );
    fxaaRenderPass.setMaterial(fxaaMaterial);

    expressionPostEffect.addRenderPasses([gammaCorrectionRenderPass, fxaaRenderPass]);
    cameraEntity.getCameraController().controller.setTarget(vrmRootEntity);

    console.log('root entity pos:',  vrmRootEntity.getTransform());
    console.log('camera pos:', cameraEntity.getTransform());


    console.log("Loaded VRM.");


  } catch (e) {
    console.error("Failed to load VRM model:", e);
  }



  // Rn.System.startRenderLoop(() => {
  //   Rn.System.process([expression]);
  // });
  console.log('Expressions:', exp);
Rn.CameraComponent.current = 0;
  draw(exp);
}

main();