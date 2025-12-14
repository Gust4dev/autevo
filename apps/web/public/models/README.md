# Pasta de Modelos 3D

Coloque seus arquivos `.glb` aqui.

## Nomenclatura Esperada

- `sedan.glb` — Modelo de sedan
- `suv.glb` — Modelo de SUV (opcional)
- `hatch.glb` — Modelo de hatch (opcional)

## Requisitos do Modelo

- **Formato:** GLB (glTF Binary)
- **Triângulos:** 8.000 - 25.000 (ideal: 18.000)
- **Compressão:** Draco recomendado (reduz ~80% do tamanho)
- **Origem:** Centro do modelo deve estar no centro do carro, chão em Y=0
- **Escala:** 1 unidade = 1 metro

## Como comprimir com Draco

Se seu modelo não está comprimido, use:

```bash
npx gltf-pipeline -i input.glb -o sedan.glb -d
```

Ou exporte do Blender com "Draco Compression" habilitado.
