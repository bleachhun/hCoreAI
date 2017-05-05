Creep.prototype.takeRandomStep = () => {
    utils.takeRandomStep(this);
}

Creep.prototype.avoidRoomEdge = () => {
    utils.avoidRoomEdge(this);
}

let oldCreepWithdraw = Creep.prototype.withdraw;
Creep.prototype.withdraw = (target, resourceType, amount) => {
    if (target.structureType === STRUCTURE_STORAGE && resourceType === RESOURCE_ENERGY) {
        if (this.memory.task.role === 'distributor') {
            return oldCreepWithdraw(target, resourceType, amount);
        } else if (this.room.energyCapacityAvailable + this.carryCapacity >= this.room.storage.store.energy) {
            return oldCreepWithdraw(target, resourceType, amount);
        } else {
            return ERR_NOT_ENOUGH_RESOURCES;
        }
    } else {
        return oldCreepWithdraw(target, resourceType, amount);
    }
}
