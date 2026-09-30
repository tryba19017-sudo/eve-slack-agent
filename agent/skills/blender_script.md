---
description: "Use when the user asks for a Blender Python (bpy) script to automate modeling, materials, lighting, rendering, batch export or scene cleanup."
---

При написании скрипта для Blender:

1. Уточни версию Blender, если она важна (API 4.x отличается от 2.9x/3.x: например, `Principled BSDF` входы `Subsurface Weight`, `Transmission Weight`, `Specular IOR Level` в 4.x).
2. Пиши самодостаточный скрипт: `import bpy`, при необходимости `import bmesh`, `mathutils`. Не полагайся на выделение и активный объект без явной установки.
3. Создавай данные через `bpy.data` (меши, материалы, камеры), а не через `bpy.ops`, где это возможно — так быстрее и не зависит от контекста.
4. Для материалов используй ноды: `mat.use_nodes = True`, находи `Principled BSDF` по типу (`node.type == 'BSDF_PRINCIPLED'`), а не по имени. Числовые значения бери из `pbr_material`.
5. Для пакетной обработки/экспорта: цикл по `bpy.data.objects` или коллекции, применяй трансформации (`bpy.ops.object.transform_apply`), экспорт через `bpy.ops.export_scene.gltf` / `fbx` с явными параметрами осей и масштаба (сверяйся с `scene_units`).
6. В конце кратко объясни запуск: вкладка Scripting → Run Script, или `blender -b file.blend -P script.py` для фонового режима.
7. Предупреждай о разрушающих операциях (удаление объектов, применение модификаторов) и предлагай сохранить копию файла.
