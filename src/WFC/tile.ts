class Tile {
    slotType: Array<string>;
    weight: number;
    //modelMatrix: mat4;

    constructor() {
        // 0: right (x+)
        // 1: back  (z-)
        // 2: left  (x-)
        // 3: front (z+)
        // 4: top   (y+)
        // 5: bottom(y-)
        this.slotType = new Array<string>(6);
        this.weight = 1;
    }

    // clock-wise from top
    rotate() {
        let newTile = new Tile();
        for (let i = 0; i < 4; i++) {
            newTile.slotType[i] = this.slotType[(i + 1) % 4];
        }
        newTile.slotType[4] = rotSlotType(this.slotType[4]);
        newTile.slotType[5] = rotSlotType(this.slotType[5]);
        return newTile;
    }

    // along x axis
    mirror() {
        let newTile = new Tile();
        for (let i = 0; i < 4; i++) {
            newTile.slotType[i] = mirSlotType(this.slotType[i % 2 ? i: 2 - i]);
        }
        newTile.slotType[4] = mirSlotType(this.slotType[4]);
        newTile.slotType[5] = mirSlotType(this.slotType[5]);
        return newTile;
    }
}

class TileSet {
    tiles: Array<Tile>;
    linkRules: {}; // {slotType: [tileID] * 6(orientation)}

    constructor() {
        //TODO: load xml
    }
}

// clock-wise from top
function rotSlotType(type: string) {
    // TODO: rotate the orientation of top and bottom slot
    return type;
}

// along x axis
function mirSlotType(type: string) {
    // TODO: inverse the symmetry property of slot
    return type;
}