export var wfcSamples =
{
    resolution: [10, 6, 10],
    tiles: [
        {name: "void", weight: 10, symmetry: "X"},
        {name: "floor", weight: 10, symmetry: "X", obj: "./model/floor.obj", collider: "./model/collider_floor.obj"},
        {name: "floor_corner", weight: 10, symmetry: "L", obj: "./model/floor_L.obj", collider: "./model/collider_floorL.obj"},
        {name: "floor_margin", weight: 10, symmetry: "T", obj: "./model/floor_T.obj", collider: "./model/collider_floorT.obj"},
        {name: "linker", weight: 1, symmetry: "T", obj: "./model/linker.obj", collider: "./model/collider_linker.obj"},
        {name: "linker_L", weight: 0.01, symmetry: "L", obj: "./model/linker_L.obj", collider: "./model/collider_linkerL.obj"},
        {name: "linker_T", weight: 2, symmetry: "T", obj: "./model/linker_T.obj", collider: "./model/collider_linkerT.obj"},
        {name: "stairs", weight: 10, symmetry: "T", obj: "./model/stairs.obj", collider: "./model/collider_stairs.obj"},
        {name: "stairs_top", weight: 1, symmetry: "T", obj: "./model/stairs_top.obj", collider: "./model/collider_stairstop.obj"},
        {name: "passage", weight: 0.5, symmetry: "I", obj: "./model/passage.obj", collider: "./model/collider_passage.obj"},
        {name: "road", weight: 500, symmetry: "I", obj: "./model/road.obj", collider: "./model/collider_floor.obj"},
        {name: "road_L", weight: 500, symmetry: "L", obj: "./model/road_L.obj", collider: "./model/collider_floor.obj"},
        {name: "road_T", weight: 300, symmetry: "T", obj: "./model/road_T.obj", collider: "./model/collider_floor.obj"},
        {name: "ground", weight: 100, symmetry: "X", obj: "./model/ground.obj", collider: "./model/collider_floor.obj"},
        {name: "brick", weight: 1.8, symmetry: "X", obj: "./model/brick.obj", collider: "./model/collider_brick.obj"},
    ],
    neighbors:[
        {left: "void", right: ["void"]},
        {left: "floor", right: ["floor", "floor_margin 3", "linker 1"]},
        {left: "floor_corner", right: ["floor_corner 1", "linker", "floor_margin 2"]},
        {left: "floor_corner 1", right: ["stairs", "stairs 1", "stairs 2", "stairs_top", "stairs_top 2", "brick", "void"]},
        {left: "floor_margin", right: ["floor_margin", "linker 2"]},
        {left: "floor_margin 3", right: ["stairs", "stairs 1", "stairs 2", "stairs_top", "stairs_top 2", "brick", "void"]},
        {left: "linker 1", right: ["passage 1", "stairs_top 1", "stairs 3", "linker_L 1", "linker_L 2", "linker_T", "linker_T 2", "linker_T 3"]},
        {left: "linker 3", right: ["linker 1"]},
        {left: "linker_L", right: ["passage 1", "stairs_top 1", "stairs 3", "linker_L 1", "linker_L 2", "linker_T", "linker_T 2", "linker_T 3"]},
        {left: "linker_L 1", right: ["stairs", "stairs 1", "stairs 2", "stairs_top", "stairs_top 2", "brick", "void"]},
        {left: "linker_T", right: ["passage 1", "stairs_top 1", "stairs 3", "linker_T", "linker_T 2", "linker_T 3"]},
        {left: "linker_T 1", right: ["passage 1", "stairs_top 1", "stairs 3"]},
        {left: "linker_T 3", right: ["stairs", "stairs 1", "stairs 2", "stairs_top", "stairs_top 2", "brick", "void"]},
        {left: "passage", right: ["stairs", "stairs 1", "stairs 2", "stairs_top", "stairs_top 2", "brick", "void"]},
        {left: "passage 1", right: ["stairs_top 1", "stairs 3", "passage 1"]},
        {left: "stairs_top", right: ["stairs", "stairs 1", "stairs 2", "stairs_top 2", "brick", "void"]},
        {left: "stairs_top 1", right: ["void"]},
        {left: "stairs_top 3", right: ["stairs 3"]},
        {left: "road", right: ["road", "road_L", "road_L 3", "road_T 1", "ground", "brick", "stairs", "stairs 1", "stairs 2"]},
        {left: "road 1", right: ["road 1", "road_L 1", "road_L 2", "road_T", "road_T 2", "road_T 3", "stairs 3"]},
        {left: "road_L", right: ["road_L 1", "load_L 2", "road_T", "road_T 2", "road_T 3", "stairs 3"]},
        {left: "road_L 1", right: ["road_L", "road_L 3", "road_T 1", "stairs", "stairs 2", "ground", "brick"]},
        {left: "road_T", right: ["road_T", "road_T 2", "road_T 3", "stairs 3"]},
        {left: "road_T 1", right: ["road_T 3", "stairs 3"]},
        {left: "road_T 3", right: ["road_T 1", "stairs", "stairs 2", "ground", "brick"]},
        {left: "stairs", right: ["stairs 2", "ground", "brick", "void"]},
        {left: "stairs 3", right: ["ground", "brick", "void"]},
        {left: "ground", right: ["ground", "brick"]},
        {left: "brick", right: ["brick", "void"]},

        {bottom: "void", top: ["passage", "void"]},
        {bottom: "floor", top: ["passage", "void"]},
        {bottom: "floor_corner", top: ["passage", "passage 1", "void"]},
        {bottom: "floor_margin", top: ["passage", "passage 1", "void"]},
        {bottom: "linker", top: ["passage", "passage 1", "void"]},
        {bottom: "linker_L", top: ["passage", "passage 1", "void"]},
        {bottom: "linker_T", top: ["passage", "passage 1", "void"]},
        {bottom: "stairs_top", top: ["passage", "passage 1", "void"]},
        {bottom: "stairs", top: ["stairs_top"]},
        {bottom: "passage", top: ["passage", "passage 1", "void"]},
        {bottom: "road", top: ["passage", "passage 1", "void"]},
        {bottom: "road_L", top: ["passage", "passage 1", "void"]},
        {bottom: "road_T", top: ["passage", "passage 1", "void"]},
        {bottom: "ground", top: ["passage", "linker_L", "void"]},
        {bottom: "brick", top: ["floor", "floor_corner", "floor_margin", "linker", "linker_L", "linker_T", "stairs", "brick", "passage"]},
        {bottom: "void", top: ["linker_L"]},
        {bottom: "floor", top: ["linker_L"]},
        {bottom: "floor_corner", top: ["linker_L", "linker_L 1", "linker_L 2", "linker_L 3"]},
        {bottom: "floor_margin", top: ["linker_L", "linker_L 1", "linker_L 2", "linker_L 3"]},
        {bottom: "linker", top: ["linker_L", "linker_L 1", "linker_L 2", "linker_L 3"]},
        {bottom: "linker_L", top: ["linker_L", "linker_L 1", "linker_L 2", "linker_L 3"]},
        {bottom: "linker_T", top: ["linker_L", "linker_L 1", "linker_L 2", "linker_L 3"]},
        {bottom: "stairs_top", top: ["linker_L", "linker_L 1", "linker_L 2", "linker_L 3"]},
        {bottom: "stairs", top: ["stairs_top"]},
        {bottom: "passage", top: [ "linker_L", "linker_L 1"]},
        {bottom: "road", top: ["linker_L", "linker_L 1"]},
        {bottom: "road_L", top: ["linker_L", "linker_L 1", "linker_L 2", "linker_L 3"]},
        {bottom: "road_T", top: ["linker_L", "linker_L 1", "linker_L 2", "linker_L 3"]},
        {bottom: "ground", top: ["linker_L"]},

    ],
    limits: [
        {min: [0, 0, 0], max: [10, 1, 10], tiles: "road road_L road_T ground brick stairs"},
        {min: [0, 5, 0], max: [10, 6, 10], tiles: "void"}
    ]
};