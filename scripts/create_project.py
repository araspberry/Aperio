from pathlib import Path
import hashlib,plistlib
root=Path(__file__).resolve().parent.parent
out=root/'Aperio.xcodeproj';out.mkdir(exist_ok=True)
def uid(v):return hashlib.sha1(v.encode()).hexdigest()[:24].upper()
def q(v):return '"'+v.replace('\\','\\\\').replace('"','\\"')+'"'
objects=[]
def obj(k,kind,fields):
 key=uid(k);objects.append(f'{key} = {{isa = {kind}; {fields}}};');return key
files=[];builds=[]
for f in sorted((root/'Aperio').rglob('*.swift')):
 path=str(f.relative_to(root));ref=obj(path,'PBXFileReference',f'lastKnownFileType = sourcecode.swift; path = {q(path)}; sourceTree = SOURCE_ROOT;')
 files.append(ref);builds.append(obj('build:'+path,'PBXBuildFile',f'fileRef = {ref};'))
resource=obj('Resources','PBXFileReference','lastKnownFileType = folder; path = Aperio/Content; sourceTree = SOURCE_ROOT;')
resourceBuild=obj('ResourcesBuild','PBXBuildFile',f'fileRef = {resource};')
assets=obj('Assets','PBXFileReference','lastKnownFileType = folder.assetcatalog; path = Aperio/Assets.xcassets; sourceTree = SOURCE_ROOT;')
assetBuild=obj('AssetsBuild','PBXBuildFile',f'fileRef = {assets};')
privacy=obj('Privacy','PBXFileReference','lastKnownFileType = text.xml; path = Aperio/PrivacyInfo.xcprivacy; sourceTree = SOURCE_ROOT;')
privacyBuild=obj('PrivacyBuild','PBXBuildFile',f'fileRef = {privacy};')
product=obj('product','PBXFileReference','explicitFileType = wrapper.application; path = Aperio.app; sourceTree = BUILT_PRODUCTS_DIR;')
products=obj('products','PBXGroup',f'children = ({product},); name = Products; sourceTree = "<group>";')
main=obj('main','PBXGroup',f'children = ({",".join(files+[resource,assets,privacy,products])},); sourceTree = "<group>";')
sources=obj('sources','PBXSourcesBuildPhase',f'buildActionMask = 2147483647; files = ({",".join(builds)},); runOnlyForDeploymentPostprocessing = 0;')
resources=obj('resources','PBXResourcesBuildPhase',f'buildActionMask = 2147483647; files = ({resourceBuild},{assetBuild},{privacyBuild},); runOnlyForDeploymentPostprocessing = 0;')
frameworks=obj('frameworks','PBXFrameworksBuildPhase','buildActionMask = 2147483647; files = (); runOnlyForDeploymentPostprocessing = 0;')
base='CLANG_ENABLE_MODULES = YES; SDKROOT = iphoneos; IPHONEOS_DEPLOYMENT_TARGET = 17.0; SWIFT_VERSION = 5.0; ENABLE_USER_SCRIPT_SANDBOXING = YES;'
app='PRODUCT_NAME = Aperio; PRODUCT_BUNDLE_IDENTIFIER = com.aperio.bible; INFOPLIST_FILE = Aperio/Info.plist; GENERATE_INFOPLIST_FILE = NO; CODE_SIGN_STYLE = Automatic; TARGETED_DEVICE_FAMILY = "1,2"; MARKETING_VERSION = 2.0.0; CURRENT_PROJECT_VERSION = 27; ASSETCATALOG_COMPILER_APPICON_NAME = AppIcon; OTHER_LDFLAGS = "-lsqlite3"; SWIFT_EMIT_LOC_STRINGS = YES;'
configlists={}
for target,extra in [('project',base),('app',app)]:
 cs=[]
 for name in ['Debug','Release']:
  opt='SWIFT_OPTIMIZATION_LEVEL = "-Onone"; DEBUG_INFORMATION_FORMAT = dwarf; ENABLE_TESTABILITY = YES; SWIFT_ACTIVE_COMPILATION_CONDITIONS = DEBUG;' if name=='Debug' else 'SWIFT_OPTIMIZATION_LEVEL = "-O"; DEBUG_INFORMATION_FORMAT = "dwarf-with-dsym"; VALIDATE_PRODUCT = YES;'
  cs.append(obj(target+name,'XCBuildConfiguration',f'buildSettings = {{{extra} {opt}}}; name = {name};'))
 configlists[target]=obj(target+'configs','XCConfigurationList',f'buildConfigurations = ({",".join(cs)},); defaultConfigurationIsVisible = 0; defaultConfigurationName = Release;')
target=obj('target','PBXNativeTarget',f'buildConfigurationList = {configlists["app"]}; buildPhases = ({sources},{frameworks},{resources},); buildRules = (); dependencies = (); name = Aperio; productName = Aperio; productReference = {product}; productType = "com.apple.product-type.application";')
uiFile=obj('uiFile','PBXFileReference','lastKnownFileType = sourcecode.swift; path = AperioUITests/AperioUITests.swift; sourceTree = SOURCE_ROOT;')
uiBuild=obj('uiBuild','PBXBuildFile',f'fileRef = {uiFile};')
uiSources=obj('uiSources','PBXSourcesBuildPhase',f'buildActionMask = 2147483647; files = ({uiBuild},); runOnlyForDeploymentPostprocessing = 0;')
uiProduct=obj('uiProduct','PBXFileReference','explicitFileType = wrapper.cfbundle; path = AperioUITests.xctest; sourceTree = BUILT_PRODUCTS_DIR;')
uiProxy=obj('uiProxy','PBXContainerItemProxy',f'containerPortal = {uid("project")}; proxyType = 1; remoteGlobalIDString = {target}; remoteInfo = Aperio;')
uiDependency=obj('uiDependency','PBXTargetDependency',f'target = {target}; targetProxy = {uiProxy};')
uiConfigs=[]
for name in ['Debug','Release']:
 uiConfigs.append(obj('ui'+name,'XCBuildConfiguration',f'buildSettings = {{PRODUCT_NAME = AperioUITests; PRODUCT_BUNDLE_IDENTIFIER = com.aperio.bible.uitests; GENERATE_INFOPLIST_FILE = YES; TEST_TARGET_NAME = Aperio; TARGETED_DEVICE_FAMILY = "1,2"; SWIFT_VERSION = 5.0;}}; name = {name};'))
uiConfigList=obj('uiConfigList','XCConfigurationList',f'buildConfigurations = ({",".join(uiConfigs)},); defaultConfigurationIsVisible = 0; defaultConfigurationName = Release;')
uiTarget=obj('uiTarget','PBXNativeTarget',f'buildConfigurationList = {uiConfigList}; buildPhases = ({uiSources},); buildRules = (); dependencies = ({uiDependency},); name = AperioUITests; productName = AperioUITests; productReference = {uiProduct}; productType = "com.apple.product-type.bundle.ui-testing";')
project=obj('project','PBXProject',f'attributes = {{BuildIndependentTargetsInParallel = YES; LastUpgradeCheck = 2620;}}; buildConfigurationList = {configlists["project"]}; compatibilityVersion = "Xcode 14.0"; developmentRegion = en; hasScannedForEncodings = 0; knownRegions = (en,Base,); mainGroup = {main}; productRefGroup = {products}; projectDirPath = ""; projectRoot = ""; targets = ({target},{uiTarget},);')
(out/'project.pbxproj').write_text('// !$*UTF8*$!\n{archiveVersion = 1; classes = {}; objectVersion = 56; objects = {\n'+'\n'.join(objects)+f'\n}}; rootObject = {project};}}\n')
scheme=out/'xcshareddata/xcschemes';scheme.mkdir(parents=True,exist_ok=True)
buildable=f'<BuildableReference BuildableIdentifier="primary" BlueprintIdentifier="{target}" BuildableName="Aperio.app" BlueprintName="Aperio" ReferencedContainer="container:Aperio.xcodeproj"/>'
(scheme/'Aperio.xcscheme').write_text(f'''<?xml version="1.0" encoding="UTF-8"?><Scheme LastUpgradeVersion="2620" version="1.3"><BuildAction parallelizeBuildables="YES" buildImplicitDependencies="YES"><BuildActionEntries><BuildActionEntry buildForTesting="YES" buildForRunning="YES" buildForProfiling="YES" buildForArchiving="YES" buildForAnalyzing="YES">{buildable}</BuildActionEntry></BuildActionEntries></BuildAction><TestAction buildConfiguration="Debug"><Testables><TestableReference skipped="NO"><BuildableReference BuildableIdentifier="primary" BlueprintIdentifier="{uiTarget}" BuildableName="AperioUITests.xctest" BlueprintName="AperioUITests" ReferencedContainer="container:Aperio.xcodeproj"/></TestableReference></Testables></TestAction><LaunchAction buildConfiguration="Debug" selectedDebuggerIdentifier="Xcode.DebuggerFoundation.Debugger.LLDB" selectedLauncherIdentifier="Xcode.IDEFoundation.Launcher.LLDB" launchStyle="0" useCustomWorkingDirectory="NO" ignoresPersistentStateOnLaunch="NO" debugDocumentVersioning="YES" debugServiceExtension="internal" allowLocationSimulation="YES"><BuildableProductRunnable runnableDebuggingMode="0">{buildable}</BuildableProductRunnable></LaunchAction><ProfileAction buildConfiguration="Release"><BuildableProductRunnable runnableDebuggingMode="0">{buildable}</BuildableProductRunnable></ProfileAction><AnalyzeAction buildConfiguration="Debug"/><ArchiveAction buildConfiguration="Release" revealArchiveInOrganizer="YES"/></Scheme>''')
info={'UIViewControllerBasedStatusBarAppearance':False,'UIStatusBarStyle':'UIStatusBarStyleLightContent','CFBundleInfoDictionaryVersion':'6.0','CFBundleDevelopmentRegion':'en','CFBundleDisplayName':'Aperio','CFBundleIdentifier':'$(PRODUCT_BUNDLE_IDENTIFIER)','CFBundleName':'$(PRODUCT_NAME)','CFBundleExecutable':'$(EXECUTABLE_NAME)','CFBundlePackageType':'APPL','CFBundleShortVersionString':'$(MARKETING_VERSION)','CFBundleVersion':'$(CURRENT_PROJECT_VERSION)','LSRequiresIPhoneOS':True,'ITSAppUsesNonExemptEncryption':False,'UILaunchScreen':{},'UIApplicationSceneManifest':{'UIApplicationSupportsMultipleScenes':False},'UISupportedInterfaceOrientations~ipad':['UIInterfaceOrientationPortrait','UIInterfaceOrientationPortraitUpsideDown','UIInterfaceOrientationLandscapeLeft','UIInterfaceOrientationLandscapeRight'],'UISupportedInterfaceOrientations':['UIInterfaceOrientationPortrait','UIInterfaceOrientationLandscapeLeft','UIInterfaceOrientationLandscapeRight'],'CFBundleURLTypes':[{'CFBundleURLName':'com.aperio.bible','CFBundleURLSchemes':['aperio']}]}
(root/'Aperio/Info.plist').write_bytes(plistlib.dumps(info))
privacy={'NSPrivacyTracking':False,'NSPrivacyTrackingDomains':[],'NSPrivacyCollectedDataTypes':[],'NSPrivacyAccessedAPITypes':[]}
(root/'Aperio/PrivacyInfo.xcprivacy').write_bytes(plistlib.dumps(privacy))
assetsDir=root/'Aperio/Assets.xcassets';assetsDir.mkdir(exist_ok=True)
(assetsDir/'Contents.json').write_text('{"info":{"author":"xcode","version":1}}')
print('Generated native Xcode project')
