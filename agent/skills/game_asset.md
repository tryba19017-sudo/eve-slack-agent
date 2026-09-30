---
description: "Use when the user prepares a 3D model for a game engine, web (three.js/glTF), AR or VR: retopology, UVs, baking, LODs, texture sets and export."
---

Пайплайн игрового/real-time ассета:

1. Спроси целевую платформу и роль ассета и вызови `asset_budget` — это ориентир по треугольникам, текстурам и LOD.
2. High-poly → low-poly: ретопология (Quad Remesher, Instant Meshes, ручная в Blender/Maya/TopoGun). Силуэт важнее плоских деталей — их запекаем.
3. UV: минимум растяжений, единая плотность текселей (texel density из `asset_budget`), швы в незаметных местах, падинг 8–16 px на 2K. Повторяющиеся части — стек/mirror UV.
4. Запекание (Substance Painter, Marmoset, Blender): normal (OpenGL для Unity/Blender/three.js, DirectX для Unreal), AO, curvature, thickness, ID. Используй cage или averaged normals, чтобы избежать артефактов на жёстких гранях.
5. Текстуры: Base Color, Normal, ORM (AO/Roughness/Metallic в каналах R/G/B) — стандарт для Unreal и glTF. Разрешение — степень двойки.
6. LOD: по таблице из `asset_budget`; для web/мобайла — ещё и Draco/meshopt сжатие геометрии и KTX2 для текстур.
7. Экспорт: проверь масштаб и оси через `scene_units`, примени трансформации, pivot внизу по центру (для пропсов), имена в латинице без пробелов (`SM_Chair_01`, `T_Chair_01_BC`).
8. Проверь в движке: освещение, нормали, коллизия, draw calls.
