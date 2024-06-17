from PIL import Image
import os

name= 'white.png'
color= 0x00ff00
# 创建一个1x1的红色图像
image = Image.new('RGB', (16, 16), color)

# 保存图像到当前目录
print(os.path.join(os.path.dirname(os.path.abspath(__file__)),name))
image.save(os.path.join(os.path.dirname(os.path.abspath(__file__)),name))
