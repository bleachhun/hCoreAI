brain.special.roleManager = function () {
    for (let creepName in Game.creeps) {
        let creep = Game.creeps[creepName];
        let task = creep.memory.task;

        if (task.hasResource && _.sum(creep.carry) == 0) {
            task.hasResource = false;
        }
        if (!task.hasResource && _.sum(creep.carry) == creep.carryCapacity) {
            task.hasResource = true;
        }

        /**************************/
        /******* PROSPECTOR *******/
        /**************************/

        // A prospector moves to its designated room and builds the spawn
        if (task.role == 'prospector') {
            if (task.hasResource) {
                if (creep.room.name != Game.getObjectById(task.endPoint.id).room.name) {
                    creep.moveTo(Game.getObjectById(task.endPoint.id));
                } else {
                    let constructionSite = creep.pos.findClosestByPath(FIND_MY_CONSTRUCTION_SITES);
                    let container = creep.pos.findClosestByPath(FIND_STRUCTURES, { filter: (s) => s.structureType == STRUCTURE_CONTAINER });

                    if (constructionSite) {
                        if (creep.build(constructionSite) == ERR_NOT_IN_RANGE) {
                            creep.moveTo(constructionSite);
                        }
                    } else if (container) {
                        if (creep.transfer(container, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                            creep.moveTo(container);
                        }
                    } else {
                        let repairSite = creep.pos.findClosestByPath(FIND_STRUCTURES, { filter: (s) => s.structureType == STRUCTURE_ROAD && s.hits < s.hitsMax && s.hits < 25000 });
                        if (creep.ticksToLive < 200 && repairSite) {
                            // start repairing what can be repaired
                            if (creep.repair(repairSite) == ERR_NOT_IN_RANGE) {
                                creep.moveTo(repairSite);
                            }
                        } else {
                            // drop energy
                            creep.drop(RESOURCE_ENERGY);
                        }
                    }
                }
            } else if (!task.hasResource) {
                // TODO: If the room has lost all creeps, line 49 will cause an error that can only be solved by killing the prospector causing the error.
                // Perhaps we could fix this, by giving the creep a memory.room, so it can always find the room, after which Game.getObjectById() will be able to pickup the corresponding object.
                // I'm thinking this error, will not be addressed until we create the new memory module
                if (creep.room.name != Game.getObjectById(task.endPoint.id).room.name) {
                    creep.moveTo(Game.getObjectById(task.endPoint.id));
                } else {
                    if (creep.harvest(Game.getObjectById(task.endPoint.id)) == ERR_NOT_IN_RANGE) {
                        creep.moveTo(Game.getObjectById(task.endPoint.id));
                    }
                }
            }
        }

        /*************************/
        /******* COLLECTOR *******/
        /*************************/

        // A prospector moves to an adjacent room, that has no owner, harvests the nearest source and returns to a controlled rooms storage
        if (task.role == 'collector') {
            if (task.hasResource) {
                if (creep.room.name != task.endPoint.roomName) {
                    creep.moveTo(new RoomPosition(25, 25, task.endPoint.roomName), { reusePath: 50 });
                } else {
                    if (creep.room.storage) {
                        if (creep.transfer(creep.room.storage, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                            creep.moveTo(creep.room.storage, { reusePath: 50 });
                        }
                    } else {
                        let container = creep.pos.findClosestByPath(FIND_STRUCTURES, { filter: (s) => s.structureType == STRUCTURE_CONTAINER });
                        if (container) {
                            if (creep.transfer(container, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                                creep.moveTo(container);
                            }
                        }
                    }
                }
            } else if (!task.hasResource) {
                if (creep.room.name != task.startPoint.roomName) {
                    creep.moveTo(new RoomPosition(25, 25, task.startPoint.roomName), { reusePath: 50 });
                } else {
                    let droppedEnergy = _.max(creep.room.find(FIND_DROPPED_ENERGY), (r) => r.amount);

                    let container = creep.pos.findClosestByPath(FIND_STRUCTURES, { filter: (s) => s.structureType == STRUCTURE_CONTAINER && s.store.energy > 1200 });

                    if (creep.room.storage) {
                        if (creep.room.storage.store.energy > 1200) {
                            if (creep.withdraw(creep.room.storage, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                                creep.moveTo(creep.room.storage);
                            }
                        } else if (container) {
                            if (creep.withdraw(container, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                                creep.moveTo(container);
                            }
                        }
                    } else if (container) {
                        if (creep.withdraw(container, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                            creep.moveTo(container);
                        }
                    } else if (droppedEnergy) {
                        if (creep.pickup(droppedEnergy, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                            creep.moveTo(droppedEnergy);
                        }
                    }
                }
            }
        }

        /***********************/
        /******* CLAIMER *******/
        /***********************/

        // A claimer goes to its designated room and claims the controller
        if (task.role == 'claimer') {
            if (creep.room.name != task.endPoint.roomName) {
                creep.moveTo(new RoomPosition(25, 25, task.endPoint.roomName), { reusePath: 50 });
            } else {
                if (task.claim) {
                    //claim
                    if (creep.claimController(creep.room.controller) == ERR_NOT_IN_RANGE) {
                        creep.moveTo(creep.room.controller);
                    }
                    // set isClaimed to true in claimList
                } else {
                    //reserve
                    if (creep.reserveController(creep.room.controller) == ERR_NOT_IN_RANGE) {
                        creep.moveTo(creep.room.controller, { reusePath: 50 });
                    }
                }

            }
        }

        /***********************/
        /******* ATTACKER *******/
        /***********************/

        // A claimer goes to its designated room and claims the controller
        if (task.role == 'attacker') {
            let squad = Memory.squads[creep.memory.task.squad];

            if (!squad.attacking && creep.room.name != task.startPoint.room.name) {
                // move to rendevour point
                creep.moveTo(new RoomPosition(25, 25, task.startPoint.room.name));
            } else if (squad.attacking) {
                // start the attack

                // avoid room changing
                utils.avoidRoomEdge(creep);

                if (creep.room.name != task.endPoint.roomName) {
                    creep.moveTo(new RoomPosition(25, 25, task.endPoint.roomName));
                } else {

                    // start the actual attack
                    let hostiles = creep.pos.findClosestByPath(FIND_HOSTILE_CREEPS);
                    let hostilesStructures = creep.pos.findClosestByPath(FIND_HOSTILE_STRUCTURES, {
                        filter: (s) =>
                            s.structureType == STRUCTURE_TOWER ||
                            s.structureType == STRUCTURE_SPAWN ||
                            s.structureType == STRUCTURE_EXTENSION ||
                            s.structureType == STRUCTURE_TOWER
                        }
                    );

                    if (hostiles) {
                        config.log(3, 'attacker debug, attack creep');
                        creep.rangedMassAttack();
                        if (creep.attack(hostiles) == ERR_NOT_IN_RANGE) {
                            creep.moveTo(hostiles);
                        }
                    } else if (hostilesStructures) {
                        config.log(3, 'attacker debug, attack structures');
                        creep.rangedMassAttack();
                        if (creep.attack(hostilesStructures) == ERR_NOT_IN_RANGE) {
                            creep.moveTo(hostilesStructures);
                        }
                    }
                }
            } else if (!squad.attacking && creep.room.name == task.startPoint.room.name && creep.pos != task.startPoint.pos) {
                // move closer to rendevour point
                config.log(3, 'attacker debug, move to flag');
                creep.moveTo(new RoomPosition(task.startPoint.pos.x, task.startPoint.pos.y, task.startPoint.pos.roomName));
            }
        }
    }
}