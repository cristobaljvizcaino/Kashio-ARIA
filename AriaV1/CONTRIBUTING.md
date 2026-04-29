# Guía de Contribución - ARIA

¡Gracias por tu interés en contribuir a ARIA! Esta guía te ayudará a empezar.

---

## 📋 Tabla de Contenidos

1. [Código de Conducta](#código-de-conducta)
2. [¿Cómo puedo contribuir?](#cómo-puedo-contribuir)
3. [Configuración del Entorno](#configuración-del-entorno)
4. [Estándares de Código](#estándares-de-código)
5. [Proceso de Pull Request](#proceso-de-pull-request)
6. [Convenciones de Commit](#convenciones-de-commit)
7. [Estructura del Proyecto](#estructura-del-proyecto)
8. [Testing](#testing)
9. [Documentación](#documentación)

---

## 🤝 Código de Conducta

Este proyecto sigue el estándar de conducta profesional de Kashio:

- ✅ Respeto mutuo entre colaboradores
- ✅ Comunicación constructiva y profesional
- ✅ Enfoque en la calidad del código
- ✅ Colaboración sobre competencia

---

## 🚀 ¿Cómo puedo contribuir?

### Reportar Bugs

1. Verifica que el bug no esté ya reportado en Issues
2. Abre un nuevo Issue usando el template de Bug Report
3. Incluye:
   - Pasos para reproducir
   - Comportamiento esperado vs actual
   - Screenshots si aplica
   - Información del entorno (browser, OS)

### Sugerir Mejoras

1. Abre un Issue con el template de Feature Request
2. Describe claramente:
   - El problema que resuelve
   - La solución propuesta
   - Alternativas consideradas
   - Impacto en usuarios

### Contribuir Código

1. Fork el repositorio
2. Crea una rama feature (`git checkout -b feature/mi-feature`)
3. Commitea tus cambios siguiendo las convenciones
4. Push a tu fork (`git push origin feature/mi-feature`)
5. Abre un Pull Request

---

## ⚙️ Configuración del Entorno

### Prerrequisitos

- Node.js >= 18.0.0
- npm >= 9.0.0
- Git
- Editor de código (VS Code recomendado)

### Instalación

```bash
# Clonar el repositorio
git clone https://github.com/kashio/ARIA.git
cd ARIA

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env.local
# Editar .env.local con tus credenciales

# Iniciar servidor de desarrollo
npm run dev
```

### VS Code (Recomendado)

**Extensiones recomendadas**:
- ESLint
- Prettier
- TypeScript and JavaScript Language Features
- Tailwind CSS IntelliSense

Configuración en `.vscode/settings.json` (crear si no existe):

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.tsdk": "node_modules/typescript/lib"
}
```

---

## 📝 Estándares de Código

### TypeScript

✅ **Usar**:
- Tipado explícito en props y funciones públicas
- Interfaces para objetos complejos
- Enums para conjuntos cerrados de valores
- Type guards cuando sea necesario

❌ **Evitar**:
- `any` (usar `unknown` si es necesario)
- Type assertions innecesarias (`as`)
- Interfaces vacías
- Duplicación de tipos

**Ejemplo**:

```typescript
// ✅ Correcto
interface UserProps {
  name: string;
  age: number;
  isActive: boolean;
}

function greetUser({ name, age }: UserProps): string {
  return `Hello ${name}, you are ${age} years old`;
}

// ❌ Incorrecto
function greetUser(props: any) {
  return `Hello ${props.name}`;
}
```

### React

✅ **Usar**:
- Componentes funcionales con hooks
- Props destructuring
- Composition sobre herencia
- Componentes pequeños y reutilizables

❌ **Evitar**:
- Class components (a menos que sea necesario)
- Inline styles (usar Tailwind)
- Lógica compleja en JSX
- Props drilling excesivo (>3 niveles)

**Ejemplo**:

```typescript
// ✅ Correcto
interface ButtonProps {
  onClick: () => void;
  children: React.ReactNode;
  variant?: 'primary' | 'secondary';
}

const Button: React.FC<ButtonProps> = ({ 
  onClick, 
  children, 
  variant = 'primary' 
}) => {
  const className = variant === 'primary' 
    ? 'bg-indigo-600 text-white' 
    : 'bg-slate-200 text-slate-700';
  
  return (
    <button onClick={onClick} className={`px-4 py-2 rounded ${className}`}>
      {children}
    </button>
  );
};

// ❌ Incorrecto
function Button(props) {
  return <button onClick={props.onClick}>{props.children}</button>;
}
```

### Tailwind CSS

✅ **Usar**:
- Clases utility-first
- Responsive modifiers (`md:`, `lg:`)
- State modifiers (`hover:`, `focus:`)
- Custom classes solo cuando sea necesario

❌ **Evitar**:
- Inline styles
- Clases CSS personalizadas para cosas que Tailwind cubre
- Repetición de mismas combinaciones (crear componente)

**Ejemplo**:

```tsx
// ✅ Correcto
<div className="flex items-center space-x-4 p-6 bg-white rounded-2xl border border-slate-200 hover:shadow-lg transition-shadow">
  <Icon size={24} className="text-indigo-600" />
  <span className="text-sm font-bold text-slate-900">Label</span>
</div>

// ❌ Incorrecto
<div style={{ display: 'flex', padding: '24px', backgroundColor: 'white' }}>
  <span>Label</span>
</div>
```

### Naming Conventions

| Tipo | Convención | Ejemplo |
|------|-----------|---------|
| Componentes | PascalCase | `UserProfile`, `DataTable` |
| Funciones | camelCase | `fetchData`, `handleClick` |
| Hooks | camelCase + "use" prefix | `useAuth`, `useFetchData` |
| Constantes | UPPER_SNAKE_CASE | `API_BASE_URL`, `MAX_ITEMS` |
| Interfaces | PascalCase + "Props"/"Interface" | `UserProps`, `ApiResponse` |
| Enums | PascalCase | `GateStatus`, `ArtifactType` |
| Archivos | PascalCase (componentes) o camelCase (utils) | `Button.tsx`, `apiClient.ts` |

---

## 🔀 Proceso de Pull Request

### Antes de Crear el PR

1. ✅ Asegúrate de que tu código compila sin errores
2. ✅ Ejecuta linter: `npm run lint`
3. ✅ Ejecuta tests (cuando estén disponibles): `npm test`
4. ✅ Actualiza documentación si es necesario
5. ✅ Rebasa tu rama con `main` si hay conflictos

### Crear el PR

1. **Título claro**: `[Feature/Fix/Docs] Descripción breve`
   - Ejemplos:
     - `[Feature] Add KPC product version history`
     - `[Fix] Resolve artifact generation timeout`
     - `[Docs] Update API integration guide`

2. **Descripción completa**:

```markdown
## Descripción
Breve resumen de los cambios.

## Tipo de cambio
- [ ] Bug fix
- [ ] Nueva funcionalidad
- [ ] Breaking change
- [ ] Documentación

## ¿Cómo se ha probado?
Describe las pruebas realizadas.

## Screenshots (si aplica)
Adjunta capturas de pantalla.

## Checklist
- [ ] Mi código sigue los estándares del proyecto
- [ ] He actualizado la documentación
- [ ] He agregado tests (si aplica)
- [ ] No hay warnings de linter
```

### Revisión del PR

**Criterios de aprobación**:
- ✅ Al menos 1 aprobación de Tech Lead
- ✅ Sin conflictos con `main`
- ✅ CI/CD pasa (cuando esté configurado)
- ✅ Documentación actualizada

**Tiempo de respuesta**:
- Primera revisión: 24-48 horas
- Follow-ups: 24 horas

---

## 📝 Convenciones de Commit

Usamos [Conventional Commits](https://www.conventionalcommits.org/).

### Formato

```
<type>(<scope>): <subject>

[optional body]

[optional footer]
```

### Types

- `feat`: Nueva funcionalidad
- `fix`: Bug fix
- `docs`: Cambios en documentación
- `style`: Formateo, punto y coma faltantes (no afecta código)
- `refactor`: Refactoring (no cambia funcionalidad)
- `perf`: Mejoras de performance
- `test`: Agregar o modificar tests
- `chore`: Mantenimiento, dependencias, etc.

### Ejemplos

```bash
# Nueva funcionalidad
git commit -m "feat(generation): add bulk artifact generation"

# Bug fix
git commit -m "fix(intake): resolve form validation error on submit"

# Documentación
git commit -m "docs(readme): update installation instructions"

# Refactoring
git commit -m "refactor(components): extract common Button component"

# Performance
git commit -m "perf(inventory): implement virtual scrolling for large lists"
```

### Scope (opcional pero recomendado)

Módulos principales:
- `oea`: OEA Strategy
- `portfolio`: Portfolio Management
- `prioritization`: Prioritization
- `overview`: PDLC Overview
- `intake`: Intake Hub
- `generation`: ARIA Generation
- `inventory`: Inventory
- `library`: Library
- `kpc`: KPC Catalog
- `governance`: Governance & Audit
- `components`: Componentes compartidos
- `services`: Servicios (AI, API)
- `types`: TypeScript types
- `config`: Configuración
- `docs`: Documentación

---

## 🏗️ Estructura del Proyecto

```
src/
├── components/          # Componentes reutilizables
│   ├── Layout.tsx      # ← Layout principal
│   ├── Timeline.tsx    # ← Timeline de gates
│   └── ...
├── views/              # Vistas/páginas principales
│   ├── Overview.tsx    # ← Cada vista es un "módulo"
│   └── ...
├── services/           # Lógica de negocio y API calls
│   └── geminiService.ts
├── types/              # TypeScript definitions
│   └── types.ts
├── constants/          # Datos mock y configuración
│   └── constants.tsx
├── hooks/              # Custom React hooks
├── utils/              # Funciones helper
├── config/             # Configuraciones
├── App.tsx            # Componente raíz
└── index.tsx          # Entry point
```

### Agregar un Nuevo Componente

1. Crear archivo en `src/components/NombreComponente.tsx`
2. Definir interface de props
3. Implementar componente funcional
4. Exportar por defecto
5. Importar donde se use

```typescript
// src/components/UserCard.tsx
import React from 'react';
import { User } from 'lucide-react';

interface UserCardProps {
  name: string;
  role: string;
}

const UserCard: React.FC<UserCardProps> = ({ name, role }) => {
  return (
    <div className="flex items-center space-x-3 p-4 bg-white rounded-xl">
      <User size={20} />
      <div>
        <h3 className="font-bold">{name}</h3>
        <p className="text-xs text-slate-500">{role}</p>
      </div>
    </div>
  );
};

export default UserCard;
```

### Agregar una Nueva Vista

1. Crear archivo en `src/views/NombreVista.tsx`
2. Implementar vista completa
3. Registrar en `App.tsx`:

```typescript
// App.tsx
import NuevaVista from './views/NuevaVista';

// En el switch de renderContent()
case 'nueva-vista':
  return <NuevaVista />;
```

4. Agregar entrada en el menú (`components/Layout.tsx`):

```typescript
const menuItems = [
  // ...
  { id: 'nueva-vista', label: 'Nueva Vista', icon: IconName }
];
```

---

## 🧪 Testing

**Estado actual**: Sin tests (MVP)

**Próxima fase** (Q2 2026):

### Unit Tests (Vitest)

```typescript
// Button.test.tsx
import { render, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import Button from './Button';

describe('Button', () => {
  it('calls onClick when clicked', () => {
    const handleClick = vi.fn();
    const { getByText } = render(
      <Button onClick={handleClick}>Click me</Button>
    );
    
    fireEvent.click(getByText('Click me'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

### Integration Tests

```typescript
// IntakeFlow.test.tsx
describe('Intake Flow', () => {
  it('submits intake request and receives ARIA analysis', async () => {
    // Test implementation
  });
});
```

---

## 📚 Documentación

### Actualizar Documentación

Cuando hagas cambios que afecten:

- **Frontend**: Actualizar `docs/technical/TECHNICAL_SPECIFICATION.md`
- **Modelo de datos**: Actualizar `docs/technical/DATA_MODEL.md`
- **Setup**: Actualizar `README.md`
- **API (futuro)**: Actualizar `docs/technical/API_REFERENCE.md`

### Documentar Código

```typescript
/**
 * Genera contenido de un artefacto usando Gemini AI
 * 
 * @param artifactName - Nombre del artefacto a generar
 * @param gateLabel - Label del gate (G0-G5)
 * @returns Contenido generado en formato string
 * @throws Error si la API de Gemini falla
 * 
 * @example
 * const content = await generateArtifactContent(
 *   'Ficha Funcional', 
 *   'G2 Roadmap'
 * );
 */
export async function generateArtifactContent(
  artifactName: string,
  gateLabel: string
): Promise<string> {
  // Implementation
}
```

---

## 🐛 Debugging

### Chrome DevTools

1. Abrir DevTools: `F12` o `Cmd+Option+I`
2. Ir a Sources → Breakpoints
3. Usar `debugger;` statement en código

### React DevTools

Instalar extensión: [React Developer Tools](https://chrome.google.com/webstore/detail/react-developer-tools)

### Logs

```typescript
// En desarrollo
console.log('[DEBUG]', data);

// En producción (futuro)
logger.info('User action', { userId, action });
```

---

## ❓ FAQ

### ¿Cómo agrego una nueva integración?

1. Crear servicio en `src/services/nombreIntegracion.ts`
2. Definir interfaces en `src/types/types.ts`
3. Implementar funciones de API
4. Usar desde componentes/vistas

### ¿Cómo modifico el modelo de datos?

1. Actualizar interfaces en `src/types/types.ts`
2. Actualizar constants si aplica
3. **Importante**: Actualizar `docs/technical/DATA_MODEL.md`
4. Verificar que no rompas componentes existentes

### ¿Dónde pongo código reutilizable?

- **Componentes UI**: `src/components/`
- **Lógica de negocio**: `src/utils/`
- **React hooks**: `src/hooks/`
- **API calls**: `src/services/`

---

## 📞 Contacto

**Tech Leads**:
- Arley: [email]
- Dennys: [email]

**Slack**: `#aria-dev`

**Reuniones**:
- Daily standup: 10:00 AM
- Sprint planning: Lunes (cada 2 semanas)
- Retrospectiva: Viernes (cada 2 semanas)

---

## 📜 Licencia

Código propietario de Kashio - Todos los derechos reservados © 2026

---

¡Gracias por contribuir a ARIA! 🚀

