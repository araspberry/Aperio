import Foundation
import CoreGraphics
import ImageIO
import UniformTypeIdentifiers

// Package the approved artwork at Apple's required size; do not redraw the mark.
// Run from the repository root: swift scripts/render-icon.swift Aperio/Assets.xcassets/AppIcon.appiconset
let master = URL(fileURLWithPath: "design/app-icon-master.png")
guard let source = CGImageSourceCreateWithURL(master as CFURL, nil),
      let artwork = CGImageSourceCreateImageAtIndex(source, 0, nil) else {
    fatalError("Cannot read the approved app icon master at \(master.path)")
}
let side = 1024
let context = CGContext(data: nil, width: side, height: side, bitsPerComponent: 8,
                        bytesPerRow: side * 4, space: CGColorSpace(name: CGColorSpace.sRGB)!,
                        bitmapInfo: CGImageAlphaInfo.noneSkipLast.rawValue)!
context.setFillColor(CGColor(red: 48/255, green: 53/255, blue: 54/255, alpha: 1))
context.fill(CGRect(x: 0, y: 0, width: side, height: side))
context.interpolationQuality = .high
context.draw(artwork, in: CGRect(x: 0, y: 0, width: side, height: side))
let directory = URL(fileURLWithPath: CommandLine.arguments[1])
try FileManager.default.createDirectory(at: directory, withIntermediateDirectories: true)
let output = directory.appendingPathComponent("AppIcon.png")
let destination = CGImageDestinationCreateWithURL(output as CFURL, UTType.png.identifier as CFString, 1, nil)!
CGImageDestinationAddImage(destination, context.makeImage()!, nil)
guard CGImageDestinationFinalize(destination) else { fatalError("Could not save app icon") }
