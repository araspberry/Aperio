import Foundation
import CoreGraphics
import CoreText
import ImageIO
import UniformTypeIdentifiers
let side = 1024
let context = CGContext(data:nil,width:side,height:side,bitsPerComponent:8,bytesPerRow:side*4,space:CGColorSpaceCreateDeviceRGB(),bitmapInfo:CGImageAlphaInfo.noneSkipLast.rawValue)!
context.setFillColor(CGColor(red:48/255,green:53/255,blue:54/255,alpha:1));context.fill(CGRect(x:0,y:0,width:side,height:side))
let font = CTFontCreateWithName("Georgia" as CFString,790,nil)
let string = NSAttributedString(string:"a",attributes:[NSAttributedString.Key(kCTFontAttributeName as String):font,NSAttributedString.Key(kCTForegroundColorAttributeName as String):CGColor(red:250/255,green:249/255,blue:246/255,alpha:1)])
let line = CTLineCreateWithAttributedString(string)
context.textPosition = CGPoint(x:247,y:283);CTLineDraw(line,context)
context.setFillColor(CGColor(red:205/255,green:214/255,blue:184/255,alpha:1));context.fillEllipse(in:CGRect(x:700,y:282,width:68,height:68))
let dir = URL(fileURLWithPath:CommandLine.arguments[1]);try FileManager.default.createDirectory(at:dir,withIntermediateDirectories:true)
let output = dir.appendingPathComponent("AppIcon.png")
let destination = CGImageDestinationCreateWithURL(output as CFURL,UTType.png.identifier as CFString,1,nil)!
CGImageDestinationAddImage(destination,context.makeImage()!,nil);CGImageDestinationFinalize(destination)
