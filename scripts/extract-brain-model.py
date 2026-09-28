"""Extract visible anatomy from the CC0 OpenNeuro-derived atlas GLB.
Usage: python3 scripts/extract-brain-model.py /path/to/brain-atlas.glb
"""
import json,struct,sys,hashlib
from pathlib import Path
source=Path(sys.argv[1]);blob=source.read_bytes();json_length=struct.unpack_from('<I',blob,12)[0]
gltf=json.loads(blob[20:20+json_length]);binary_start=20+json_length+8
out=bytearray();meshes=[]
def accessor(index):
    a=gltf['accessors'][index];v=gltf['bufferViews'][a['bufferView']]
    if 'byteStride' in v:raise ValueError('Interleaved source is unsupported')
    sizes={'SCALAR':1,'VEC3':3,'VEC4':4};component={5126:4,5125:4,5123:2}[a['componentType']]
    start=binary_start+v.get('byteOffset',0)+a.get('byteOffset',0)
    return blob[start:start+a['count']*sizes[a['type']]*component],a
for name in ['unified-cortex','cerebellum','brain-stem']:
    mesh=next(m for m in gltf['meshes']if m['name']==name);p=mesh['primitives'][0];entry={'name':name}
    for key,idx in [('positions',p['attributes']['POSITION']),('normals',p['attributes']['NORMAL']),('indices',p['indices'])]:
        data,a=accessor(idx)
        while len(out)%4:out.append(0)
        entry[key]={'offset':len(out),'count':a['count'],'componentType':a['componentType']};out.extend(data)
    if '_CURVATURE'in p['attributes']:
        data,a=accessor(p['attributes']['_CURVATURE']);entry['curvature']={'offset':len(out),'count':a['count']};out.extend(data)
    meshes.append(entry)
root=Path(__file__).resolve().parents[1]/'assets';root.mkdir(exist_ok=True)
(root/'anatomical-brain.bin').write_bytes(out)
(root/'anatomical-brain.json').write_text(json.dumps({'source':'https://github.com/StarKnightt/brain-explorer/blob/master/public/models/brain-atlas.glb','sourceSha256':hashlib.sha256(blob).hexdigest(),'license':'CC0-1.0','meshes':meshes},indent=2)+'\n')
print('Exported',len(out),'bytes of visible anatomy')
