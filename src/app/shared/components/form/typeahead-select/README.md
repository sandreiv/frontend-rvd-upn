# `app-typeahead-select`

Componente reutilizable para buscar o seleccionar elementos de **cualquier lista**.

## Qué soporta

### 1) Listas simples
Si tu lista ya tiene las llaves que el componente entiende, puedes usarlo directo:

- `id` o `value` -> identificador
- `nombre` o `label` -> texto principal
- `modalidad` o `secondaryLabel` -> texto secundario
- `tipo` o `badge` -> etiqueta pequeña

### 2) Listas con otros atributos
Si tu lista usa otros nombres, puedes indicarle qué campo usar:

```html
<app-typeahead-select
  [items]="miLista"
  valueKey="codigo"
  labelKey="descripcion"
  secondaryKey="subtitulo"
  badgeKey="categoria"
  (itemSelected)="usarItem($event)"
/>
```

### 3) Listas más complejas
Si tu lista no se puede mapear con llaves simples, usa `optionAdapter`:

```html
<app-typeahead-select
  [items]="miLista"
  [optionAdapter]="adapter"
  (itemSelected)="usarItem($event)"
/>
```

```ts
adapter = (item: any, index: number) => ({
  value: String(item.id ?? index),
  label: item.titulo,
  secondaryLabel: item.detalle,
  badge: item.estado,
  data: item,
});
```

## Cómo trabajar con el item seleccionado

La forma más simple es escuchar `itemSelected`:

```html
<app-typeahead-select
  [items]="estudiantes"
  valueKey="id"
  labelKey="nombre"
  (itemSelected)="onStudentSelected($event)"
/>
```

```ts
onStudentSelected(item: any) {
  console.log('Seleccionado:', item);
}
```

## Personalizar la parte visual

Puedes cambiar cómo se ve cada opción con `ng-template`:

```html
<app-typeahead-select
  [items]="miLista"
  valueKey="id"
  labelKey="nombre"
>
  <ng-template typeaheadOptionTemplate let-option>
    <div>
      <strong>{{ option.label }}</strong>
      <small *ngIf="option.secondaryLabel"> - {{ option.secondaryLabel }}</small>
    </div>
  </ng-template>
</app-typeahead-select>
```

## Modo de uso

- `mode="autocomplete"`: escribes y el componente abre la lista.
- `mode="select"`: haces clic y abre como select tradicional.

## Recomendación práctica

Si quieres algo fácil de mantener:

1. Usa `items`.
2. Define `valueKey` y `labelKey`.
3. Escucha `itemSelected`.
4. Solo usa `optionAdapter` si tu lista viene muy distinta.
5. Solo usa `ng-template` si necesitas cambiar la apariencia.

