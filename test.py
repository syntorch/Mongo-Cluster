import pymongo
from pymongo import MongoClient
import gridfs

# maxSevSelDelay = 1

def mongo(client):
    # client = MongoClient("mongodb://localhost:27100/", serverSelectionTimeoutMS=maxSevSelDelay)
    print(client.server_info())
    print(client.list_database_names())
    ddbs = client.ddbs
    print(ddbs.db_info)
    print(ddbs.list_collection_names())
    
   
    
def store_img(client):
    grid = client.gridfs
    fs = gridfs.GridFS(grid)

    # a = fs.put(b"hello world")
    # print(fs)
    # print(fs.find_one().read())
    # fs.put('', filename="aa")
    
    article_path = "/home/take/ddbs/FinalProject/dataset/articles/article0/"
    image_name = "image_a0_0.jpg"
    image_path = article_path + image_name
    with open(image_path, 'rb') as img:
        img_data = img.read()
        fs.put(img_data, filename=image_name)
    file = fs.find_one({'filename': image_name})
    image = file.read()
    with open("testimg.jpg", "wb") as img:
        img.write(image)
    

if __name__ == '__main__':
    client = MongoClient("mongodb://localhost:27100/")
    
    # store_img(client)
    
    
    mongo(client)
    
    # article_path = "/home/take/ddbs/FinalProject/dataset/articles/article0/"
    # image_path = article_path + "image_a0_0.jpg"
    # with open(image_path, 'rb') as img:
    #     img_data = img.read()
    #     print(img_data)
    # videos_path =  "/home/take/ddbs/FinalProject/dataset/video/"
    # video_path = videos_path + "video1.flv"
    # with open(video_path, 'rb') as video:
    #     video_data = video.read()
    #     print(video_data)
        
    