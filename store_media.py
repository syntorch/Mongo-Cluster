from pymongo import MongoClient
import gridfs
import os

DATA_PATH = './dataset/articles/'

def store_unstructure_data(fs):
    for article_path, _, files in os.walk(DATA_PATH):
        for file in files:
            file_path = os.path.join(article_path,file)
            with open(file_path, 'rb') as article_data:
                article_data_bin = article_data.read()
                fs.put(article_data_bin, filename=file)
               

if __name__ == '__main__':
    client = MongoClient("mongodb://localhost:27101/")
    grid = client.gridfs
    fs = gridfs.GridFS(grid)
    store_unstructure_data(fs)
    
    