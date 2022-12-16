Build up mongo



before build up make sure that you have `python3` and the interpreter has installed `pymongo`. I recommend to use virtual environment but it is not necessary.



If you have `make`:

```
make all
```

If not type the following code in the command line in the project directory path

```sh
docker-compose up -d

# init db
docker exec -it cfg1 bash -c "mongosh < /init_scripts/init_cfg1.js"
docker exec -it cfg2 bash -c "mongosh < /init_scripts/init_cfg2.js"
docker exec -it dbms1-svr1 bash -c "mongosh < /init_scripts/init_dbms1.js"
docker exec -it dbms2-svr1 bash -c "mongosh < /init_scripts/init_dbms2.js"
docker exec -it gridfs1 bash -c "mongosh < /init_scripts/init_gridfs1.js"
docker exec -it gridfs2 bash -c "mongosh < /init_scripts/init_gridfs2.js"
docker exec -it router1 bash -c "mongosh < /init_scripts/init_router1.js"
docker exec -it router2 bash -c "mongosh < /init_scripts/init_router2.js"

# structure data
docker exec -it router1 bash -c "mongoimport --db ddbs --collection user --file /dataset/user.dat"
docker exec -it router1 bash -c "mongoimport --db ddbs --collection article --file /dataset/article.dat"
docker exec -it router1 bash -c "mongoimport --db ddbs --collection read --file /dataset/read.dat"

# media
python3 store_media.py

# sharding
docker exec -it router1 bash -c "mongosh < /init_scripts/do_sharding-part1.js"
docker exec -it router1 bash -c "mongosh < /init_scripts/do_sharding-part2.js"
docker exec -it router1 bash -c "mongosh < /init_scripts/do_sharding-beread.js"
docker exec -it router1 bash -c "mongosh < /init_scripts/do_sharding-poprank.js"


```



I succeed to connect `mongodb` with `pymongo`. The python script is in `test.py`

I succeed to get image and video. The python script is in `read_media.py`

Notice that currently the port of my `mongodb-ddbs` is **27100** for structure data, and `mongodb-gridfs` is **27101** for article stuff.

http://ip:8081 for mongo express gui 

