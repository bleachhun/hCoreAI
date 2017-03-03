brain.roleManager = function () {
    for (let creepName in Game.creeps) {
        let creep = Game.creeps[creepName];
        let task = creep.memory.task;

        if (task.hasResource && _.sum(creep.carry) == 0) {
            task.hasResource = false;
        }
        if (!task.hasResource && _.sum(creep.carry) == creep.carryCapacity) {
            task.hasResource = true;
        }

        /*************************/
        /******* HARVESTER *******/
        /*************************/

        // A harvester moves to a source and deposits in resources in the closest container
        if (task.role == 'harvester') {
            if (task.hasResource) {
                let spawn = creep.pos.findClosestByPath(FIND_MY_SPAWNS);

                if (creep.room.memory.roles.roleDistributor.amountOfDistributors == 0) {
                    let spawnOrExtension = creep.pos.findClosestByPath(FIND_MY_STRUCTURES, {
                        filter: (s) =>  (s.structureType == STRUCTURE_EXTENSION && s.energy < s.energyCapacity) ||
                                        (s.structureType == STRUCTURE_SPAWN && s.energy < s.energyCapacity)
                    });

                    if (spawnOrExtension) {
                        if (creep.transfer(spawnOrExtension, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                            creep.moveTo(spawnOrExtension);
                        }
                    }
                } else {
                    if (task.endPoint) {
                        // TODO: Prevent harvester from trying to deposit in a container when primary is full and distributors/carriers exist

                        if (Game.getObjectById(task.endPoint.id).store.energy < 2000) {
                            if (creep.transfer(Game.getObjectById(task.endPoint.id), RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                                creep.moveTo(Game.getObjectById(task.endPoint.id));
                            }
                        } else {
                            let container = creep.pos.findClosestByPath(FIND_STRUCTURES, {
                                filter: (s) => s.structureType == STRUCTURE_CONTAINER && s.store.energy < 2000
                            });

                            if (container) {
                                if (creep.transfer(container, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                                    creep.moveTo(container);
                                }
                            } else if (creep.transfer(spawn, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                                creep.moveTo(spawn);
                            } else if (creep.room.storage) {
                                if (creep.transfer(creep.room.storage, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                                    creep.moveTo(creep.room.storage);
                                }
                            }
                        }
                    } else {
                        let container = creep.pos
                            .findClosestByPath(FIND_STRUCTURES, { filter: (s) => s.structureType == STRUCTURE_CONTAINER });

                        if (container) {
                            if (creep.transfer(container, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                                creep.moveTo(container);
                            }
                        } else if (spawn.energy == 300) {
                            let constructionSite = creep.pos.findClosestByPath(FIND_CONSTRUCTION_SITES);
                            if (constructionSite) {
                                if (creep.build(constructionSite) == ERR_NOT_IN_RANGE) {
                                    creep.moveTo(constructionSite);
                                }
                            }
                        } else {
                            if (creep.transfer(spawn, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                                creep.moveTo(spawn);
                            }
                        }
                    }
                }
            } else if (!task.hasResource) {
                if (creep.harvest(Game.getObjectById(task.startPoint.id)) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(Game.getObjectById(task.startPoint.id), { reusePath: 50 });
                }
            }
        }

        /***********************/
        /******* CARRIER *******/
        /***********************/

        // A carrier collects energy from containers and deposits it in a storage
        if (task.role == 'carrier') {
            if (task.hasResource) {
                if (creep.room.memory.roles.roleDistributor.amountOfDistributors == 0) {
                    let spawnOrExtension = creep.pos.findClosestByPath(FIND_MY_STRUCTURES, {
                        filter: (s) =>  (s.structureType == STRUCTURE_EXTENSION && s.energy < s.energyCapacity) ||
                                        (s.structureType == STRUCTURE_SPAWN && s.energy < s.energyCapacity)
                    });

                    if (spawnOrExtension) {
                        if (creep.transfer(spawnOrExtension, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                            creep.moveTo(spawnOrExtension);
                        }
                    }
                } else {
                    if (task.endPoint) {
                        if (creep.transfer(Game.getObjectById(task.endPoint.id), RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                            creep.moveTo(Game.getObjectById(task.endPoint.id), { reusePath: 50 });
                        }
                    } else {
                        if ((tower = creep.pos.findClosestByPath(FIND_MY_STRUCTURES, { filter: (s) => s.structureType == STRUCTURE_TOWER && s.energy < 801 })) != undefined) {
                            if (creep.transfer(tower, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                                creep.moveTo(tower);
                            }
                        }
                    }
                }
            } else if (!task.hasResource) {
                if (creep.withdraw(Game.getObjectById(task.startPoint.id), RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(Game.getObjectById(task.startPoint.id), { reusePath: 50 });
                }
            }
        }

        /***************************/
        /******* DISTRIBUTOR *******/
        /***************************/

        // A distributor collects energy from storage > container and deposists it in spawn > extensions > towers
        if (task.role == 'distributor') {
            if (task.hasResource) {
                if (creep.carry.energy < 50) task.hasResource = false;

                let spawnOrExtension = creep.pos.findClosestByPath(FIND_MY_STRUCTURES, {
                    filter: (s) =>  (s.structureType == STRUCTURE_EXTENSION && s.energy < s.energyCapacity) ||
                                    (s.structureType == STRUCTURE_SPAWN && s.energy < s.energyCapacity)
                });

                if (spawnOrExtension) {
                    if (creep.transfer(spawnOrExtension, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                        creep.moveTo(spawnOrExtension);
                    }
                } else if ((tower = creep.pos.findClosestByPath(FIND_MY_STRUCTURES, { filter: (s) => s.structureType == STRUCTURE_TOWER && s.energy < 801 })) != undefined) {
                    if (creep.transfer(tower, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                        creep.moveTo(tower);
                    }
                } else if (creep.room.storage) {
                    if (creep.transfer(creep.room.storage, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                        creep.moveTo(creep.room.storage);
                    }
                }
            } else if (!task.hasResource) {
                if (creep.carry.energy > 50) task.hasResource = true;
                if (task.startPoint) {
                    if (creep.room.energyAvailable == creep.room.energyCapacityAvailable) {
                        if ((container = creep.pos.findClosestByPath(FIND_STRUCTURES, { filter: (s) => s.structureType == STRUCTURE_CONTAINER && s.store.energy > 400 })) != undefined) {
                            if (creep.withdraw(container, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                                creep.moveTo(container, { reusePath: 50 });
                            }
                        }
                    } else if (Game.getObjectById(task.startPoint.id).store.energy > 0) {
                        if (creep.withdraw(Game.getObjectById(task.startPoint.id), RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                            creep.moveTo(Game.getObjectById(task.startPoint.id));
                        }
                    } else {
                        if ((container = creep.pos.findClosestByPath(FIND_STRUCTURES, { filter: (s) => s.structureType == STRUCTURE_CONTAINER && s.store.energy > 0 })) != undefined) {
                            if (creep.withdraw(container, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                                creep.moveTo(container, { reusePath: 50 });
                            }
                        }
                    }
                } else {
                    if ((container = creep.pos.findClosestByPath(FIND_STRUCTURES, { filter: (s) => s.structureType == STRUCTURE_CONTAINER && s.store.energy > 0 })) != undefined) {
                        if (creep.withdraw(container, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                            creep.moveTo(container, { reusePath: 50 });
                        }
                    }
                }
            }
        }

        /***********************/
        /******* BUILDER *******/
        /***********************/

        // A builder tries to take energy from a storage, otherwise harvests it, then builds > repairs
        if (task.role == 'builder') {
            if (task.hasResource) {
                let constructionSite = creep.pos.findClosestByPath(FIND_CONSTRUCTION_SITES);

                let repairSite = creep.pos.findClosestByPath(FIND_STRUCTURES,
                {
                    filter: (s) => s.hits < s.hitsMax && s.hits < 25000 && s.structureType != STRUCTURE_WALL && s.structureType != STRUCTURE_RAMPART
                });

                if (constructionSite) {
                    if (creep.build(constructionSite) == ERR_NOT_IN_RANGE) {
                        creep.moveTo(constructionSite);
                    }
                } else if (repairSite) {
                    if (creep.repair(repairSite) == ERR_NOT_IN_RANGE) {
                        creep.moveTo(repairSite);
                    }
                } else {
                    utils.takeRandomStep(creep);
                }
            } else if (!task.hasResource) {
                let droppedEnergy = creep.pos.findClosestByPath(FIND_DROPPED_ENERGY, {
                    filter: (e) => e.energy > 150
                });

                if (droppedEnergy) {
                    if (creep.pickup(droppedEnergy, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                        creep.moveTo(droppedEnergy);
                    }
                } else if (task.startPoint) {
                    if (creep.room.storage.store.energy > 200) {
                        if (creep.withdraw(Game.getObjectById(task.startPoint.id), RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                            creep.moveTo(Game.getObjectById(task.startPoint.id));
                        }
                    } else {
                        utils.takeRandomStep(creep);
                    }
                } else {
                    let container = creep.pos.findClosestByPath(FIND_STRUCTURES,
                        { filter: (s) => s.structureType == STRUCTURE_CONTAINER && s.store.energy > 200 });

                    if (container) {
                        if (creep.withdraw(container, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                            creep.moveTo(container);
                        }
                    }
                    else {
                        let source = creep.pos.findClosestByPath(FIND_SOURCES);
                        if (creep.harvest(source) == ERR_NOT_IN_RANGE) {
                            creep.moveTo(source);
                        }
                    }
                }
            }
        }

        /************************/
        /******* UPGRADER *******/
        /************************/

        // An upgrader takes energy from link > storage > container and upgrades a controller
        if (task.role == 'upgrader') {
            if (task.hasResource) {
                let link = creep.room.controller.pos.findClosestByPath(FIND_MY_STRUCTURES, { filter: (s) => s.structureType == STRUCTURE_LINK });

                if (link) {
                    creep.withdraw(link, RESOURCE_ENERGY);
                }
                if (creep.upgradeController(Game.getObjectById(task.endPoint.id)) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(Game.getObjectById(task.endPoint.id), { reusePath: 50 });
                }
            } else if (!task.hasResource) {
                let link = creep.room.controller.pos.findClosestByPath(FIND_MY_STRUCTURES, { filter: (s) => s.structureType == STRUCTURE_LINK });

                let container = creep.pos.findClosestByPath(FIND_STRUCTURES, { filter: (s) => s.structureType == STRUCTURE_CONTAINER && s.store.energy > 200 });

                if (link) {
                    if (creep.withdraw(link, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                        creep.moveTo(link);
                    }
                } else if (task.startPoint) {
                    if (creep.withdraw(Game.getObjectById(task.startPoint.id), RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                        creep.moveTo(Game.getObjectById(task.startPoint.id));
                    }
                } else if (container) {
                    if (creep.withdraw(container, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                        creep.moveTo(container);
                    }
                } else {
                    if (creep.harvest(creep.pos.findClosestByPath(FIND_SOURCES)) == ERR_NOT_IN_RANGE) {
                        creep.moveTo(creep.pos.findClosestByPath(FIND_SOURCES));
                    }
                }
            }
        }

        /**********************/
        /******* BRIDGE *******/
        /**********************/

        // A bridge takes energy from storage and delivers it a link
        if (task.role == 'bridge') {
            if (creep.carry.energy > 0) {
                task.hasResource = true;
            }
            if (task.hasResource) {
                if (creep.transfer(Game.getObjectById(task.endPoint.id), RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(Game.getObjectById(task.endPoint.id), { reusePath: 50 });
                }
            } else if (!task.hasResource) {
                if (creep.room.storage.store.energy > 800) {
                    if (creep.withdraw(Game.getObjectById(task.startPoint.id), RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                        creep.moveTo(Game.getObjectById(task.startPoint.id), { reusePath: 50 });
                    }
                }
            }
        }

        /*********************/
        /******* MINER *******/
        /*********************/

        // A miner takes mineral from extractor and transfers it to a container
        if (task.role == 'miner') {
            let mineralType = Game.getObjectById(task.startPoint.id).mineralType;
            if (task.hasResource) {
                if (creep.transfer(Game.getObjectById(task.endPoint.id), mineralType) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(Game.getObjectById(task.endPoint.id));
                }
            } else if (!task.hasResource) {
                if (creep.harvest(Game.getObjectById(task.startPoint.id), mineralType) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(Game.getObjectById(task.startPoint.id));
                }
                creep.transfer(Game.getObjectById(task.endPoint.id), mineralType);
            }
        }

        /******************************/
        /******* MINE COLLECTOR *******/
        /******************************/

        // A miner takes mineral from extractor and transfers it to a container
        if (task.role == 'mineralCollector') {
            let container = Game.getObjectById(task.startPoint.id);
            let mineralType = undefined;
            
            for (let item in container.store) {
                if (item != RESOURCE_ENERGY)
                    mineralType = item;
            }


            if (task.hasResource) {
                if (creep.transfer(Game.getObjectById(task.endPoint.id), mineralType) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(Game.getObjectById(task.endPoint.id), { reusePath: 50 });
                }
            } else if (!task.hasResource) {
                if (creep.withdraw(Game.getObjectById(task.startPoint.id), mineralType) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(Game.getObjectById(task.startPoint.id), { reusePath: 50 });
                }
            }
        }
    }
}