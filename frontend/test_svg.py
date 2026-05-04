import svgwrite
dwg = svgwrite.Drawing('/Users/mokshith/.gemini/antigravity/brain/52a0dfb6-8244-40ac-9b61-21abb4dfecfb/test_logo.svg', profile='tiny', size=(400, 400))
dwg.viewbox(0, 0, 100, 100)
path = dwg.path(d="M 50,75 C 35,60 30,35 50,45 C 70,35 65,60 50,75 C 35,90 10,35 50,15 C 90,35 65,90 50,75 Z",
                fill="none", stroke="#C85F2B", stroke_width=4, stroke_linecap="round", stroke_linejoin="round")
dwg.add(path)
dwg.save()
print("Saved SVG.")
