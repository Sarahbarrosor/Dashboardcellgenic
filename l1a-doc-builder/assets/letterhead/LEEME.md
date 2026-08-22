# Membretes

Pon aquí el logo de cada entidad, con el nombre del archivo igual a la clave de la entidad
en `case-data.json` (`entities.<clave>`):

- `petitioner.png`      → Global Stem Cells Group, Inc.
- `foreignEmployer.png` → Cellular Hope Institute, S.A. de C.V.
- `parent.png`          → Regenerative Medical Technology Group, Inc.

Formatos aceptados: `.png`, `.jpg`, `.jpeg`. Se insertan a 160×60 pt, centrados sobre el
nombre legal de la entidad.

Si no hay logo, el membrete sale igual con el nombre legal, el domicilio y el teléfono
tomados de `case-data.json`. Si falta el domicilio o el teléfono, salen resaltados en
amarillo como `[FALTA DATO]`, igual que cualquier otro hueco.

**El membrete del banco no se imita.** Los documentos A5 y B5 son borradores para que el
banco los emita en su propio papel; en su lugar llevan una nota visible que lo dice.
