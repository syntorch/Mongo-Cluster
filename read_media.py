from pymongo import MongoClient
import gridfs
import os
        
def mongofind(filename, fs):
    file = fs.find_one({'filename': filename})
    image = file.read()
    basename = os.path.basename(filename)
    with open(basename, "wb") as img:
        img.write(image)

if __name__ == '__main__':
    client = MongoClient("mongodb://localhost:27101/")
    grid = client.gridfs
    fs = gridfs.GridFS(grid)
    mongofind('image_a0_0.jpg', fs)
    
    