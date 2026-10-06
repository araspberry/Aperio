// swift-tools-version: 6.0
import PackageDescription
let package = Package(name:"AperioCore",platforms:[.macOS(.v14)],products:[.library(name:"AperioCore",targets:["AperioCore"])],targets:[.target(name:"AperioCore",path:"Aperio/Core",linkerSettings:[.linkedLibrary("sqlite3")]),.testTarget(name:"AperioCoreTests",dependencies:["AperioCore"],path:"AperioTests")],swiftLanguageModes:[.v5])
