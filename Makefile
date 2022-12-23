all: up init load load_media sharding1 sharding2 sharding3 sharding4

struct: up init load sharding1 sharding2 sharding3 sharding4

init:
	docker exec -it cfg1 bash -c "mongosh < /init_scripts/init_cfg1.js"
	docker exec -it cfg2 bash -c "mongosh < /init_scripts/init_cfg2.js"
	docker exec -it dbms1-svr1 bash -c "mongosh < /init_scripts/init_dbms1.js"
	docker exec -it dbms2-svr1 bash -c "mongosh < /init_scripts/init_dbms2.js"
	docker exec -it gridfs1 bash -c "mongosh < /init_scripts/init_gridfs1.js"
	docker exec -it gridfs2 bash -c "mongosh < /init_scripts/init_gridfs2.js"
	docker exec -it router1 bash -c "mongosh < /init_scripts/init_router1.js"
	docker exec -it router2 bash -c "mongosh < /init_scripts/init_router2.js"

load:
	docker exec -it router1 bash -c "mongoimport --db ddbs --collection user --file /dataset/user.dat"
	docker exec -it router1 bash -c "mongoimport --db ddbs --collection article --file /dataset/article.dat"
	docker exec -it router1 bash -c "mongoimport --db ddbs --collection read --file /dataset/read.dat"

load_media:
	python3 store_media.py

sharding: sharding1 sharding2 sharding3 sharding4

sharding1:
	docker exec -it router1 bash -c "mongosh < /init_scripts/do_sharding-part1.js"

sharding2:
	docker exec -it router1 bash -c "mongosh < /init_scripts/do_sharding-part2.js"

sharding3:
	docker exec -it router1 bash -c "mongosh < /init_scripts/do_sharding-beread.js"

sharding4:
	docker exec -it router1 bash -c "mongosh < /init_scripts/do_sharding-poprank.js"

up:
	docker-compose up -d

down:
	docker-compose down

clear: down
	docker volume rm $$(docker volume ls -q -f name=mongo-cluster*)