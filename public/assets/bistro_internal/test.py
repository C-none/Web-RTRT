from PIL import Image
import io

def read_webp_file(file_path):
    try:
        # 打开WebP文件
        with open(file_path, 'rb') as f:
            img = Image.open(io.BytesIO(f.read()))

        # 获取图像宽度和高度
        width, height = img.size

        # 将图像转换为RGBA模式
        img = img.convert('RGBA')

        # 获取像素数据
        pixels = list(img.getdata())

        # 打印每个像素的RGBA值
        for i, pixel in enumerate(pixels):
            red, green, blue, alpha = pixel
            print(f"Pixel {i}: R={red}, G={green}, B={blue}, A={alpha}")

    except Exception as e:
        print(f"Error: {e}")

# 使用示例
read_webp_file('./MASTER_Wood_Painted3_Specular.webp')

