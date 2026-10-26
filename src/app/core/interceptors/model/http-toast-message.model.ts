import { HttpErrorResponse } from '@angular/common/http';
import {
  BackendErrorPayload,
  extractBackendErrorMessage,
} from './backend-error.model';

export interface HttpToastMessage {
  title: string;
  message: string;
}

type HttpToastKey = `${string}:${number}`;

interface EndpointToastRule {
  pathIncludes: string;
  method?: string;
  success?: HttpToastMessage;
  error?: HttpToastMessage;
}

/**
 * Reglas de mensaje personalizado
 */
const ENDPOINT_TOAST_RULES: EndpointToastRule[] = [
  {
    pathIncludes: '/configuration/preload-call/delete-bulk',
    method: 'POST',
    success: {
      title: 'Registro Eliminado',
      message: 'Eliminado con éxito',
    },
    error: {
      title: 'Error al eliminar',
      message: 'No fue posible eliminar los registros',
    },
  },
  {
    pathIncludes: '/configuration/preload-call/delete/',
    method: 'POST',
    success: {
      title: 'Registro Eliminado',
      message: 'Eliminado con éxito',
    },
    error: {
      title: 'Error al eliminar',
      message: 'No fue posible eliminar el registro',
    },
  },
];

const SUCCESS_BY_KEY: Partial<Record<HttpToastKey, HttpToastMessage>> = {
  'POST:200': {
    title: 'Registro Creado',
    message: 'El registro se ha creado con éxito.',
  },
  'POST:201': {
    title: 'Registro Creado',
    message: 'El registro se ha creado con éxito.',
  },
  'PUT:200': {
    title: 'Registro Actualizado',
    message: 'El registro se ha actualizado con éxito.',
  },
  'PUT:201': {
    title: 'Registro Actualizado',
    message: 'El registro se ha actualizado con éxito.',
  },
  'PATCH:200': {
    title: 'Registro Actualizado',
    message: 'El registro se ha actualizado con éxito.',
  },
  'PATCH:201': {
    title: 'Registro Actualizado',
    message: 'El registro se ha actualizado con éxito.',
  },
  'DELETE:200': {
    title: 'Registro Eliminado',
    message: 'El registro se ha eliminado con éxito.',
  },
  'DELETE:204': {
    title: 'Registro Eliminado',
    message: 'El registro se ha eliminado con éxito.',
  },
};

const SUCCESS_BY_METHOD: Partial<Record<string, HttpToastMessage>> = {
  POST: {
    title: 'Registro Creado',
    message: 'El registro se ha creado con éxito.',
  },
  PUT: {
    title: 'Registro Actualizado',
    message: 'El registro se ha actualizado con éxito.',
  },
  PATCH: {
    title: 'Registro Actualizado',
    message: 'El registro se ha actualizado con éxito.',
  },
  DELETE: {
    title: 'Registro Eliminado',
    message: 'El registro se ha eliminado con éxito.',
  },
};

const ERROR_BY_STATUS: Partial<Record<number, HttpToastMessage>> = {
  400: {
    title: 'Solicitud inválida',
    message: 'La solicitud contiene datos inválidos',
  },
  401: {
    title: 'No autorizado',
    message:
      'Tu sesión ha expirado. Por favor, inicia sesión nuevamente',
  },
  403: {
    title: 'Acceso Denegado',
    message: 'No tienes permisos para realizar esta acción',
  },
  404: {
    title: 'No encontrado',
    message: 'El recurso solicitado no existe',
  },
  500: {
    title: 'Error del servidor',
    message:
      'Ha ocurrido un error en el servidor. Intenta más tarde',
  },
};

const ERROR_BY_KEY: Partial<Record<HttpToastKey, HttpToastMessage>> = {
  'POST:400': {
    title: 'Error al crear',
    message: 'No fue posible crear el registro',
  },
  'PUT:400': {
    title: 'Error al actualizar',
    message: 'No fue posible actualizar el registro',
  },
  'PATCH:400': {
    title: 'Error al actualizar',
    message: 'No fue posible actualizar el registro',
  },
  'DELETE:400': {
    title: 'Error al eliminar',
    message: 'No fue posible eliminar el registro',
  },
};

function readBodyMessage(body: unknown): string | undefined {
  if (!body || typeof body !== 'object') {
    return undefined;
  }

  const record = body as { message?: string };
  return record.message?.trim() || undefined;
}

function findEndpointRule(
  url: string,
  method: string,
): EndpointToastRule | undefined {
  return ENDPOINT_TOAST_RULES.find((rule) => {
    if (rule.method && rule.method !== method) {
      return false;
    }

    return url.includes(rule.pathIncludes);
  });
}

function mergeBodyMessage(
  toast: HttpToastMessage,
  body?: unknown,
): HttpToastMessage {
  const bodyMessage = readBodyMessage(body);

  if (!bodyMessage) {
    return toast;
  }

  return {
    title: toast.title,
    message: bodyMessage,
  };
}

export function resolveHttpSuccessToast(
  method: string,
  status: number,
  body?: unknown,
  url?: string,
): HttpToastMessage {
  if (url && status >= 200 && status < 300) {
    const rule = findEndpointRule(url, method);

    if (rule?.success) {
      return mergeBodyMessage(rule.success, body);
    }
  }

  const key = `${method}:${status}` as HttpToastKey;
  const specific = SUCCESS_BY_KEY[key];
  const bodyMessage = readBodyMessage(body);

  if (specific) {
    return {
      title: specific.title,
      message: bodyMessage ?? specific.message,
    };
  }

  if (status >= 200 && status < 300) {
    const byMethod = SUCCESS_BY_METHOD[method];

    if (byMethod) {
      return {
        title: byMethod.title,
        message: bodyMessage ?? byMethod.message,
      };
    }
  }

  return {
    title: 'Éxito',
    message: bodyMessage ?? 'Operación completada exitosamente',
  };
}

export function resolveHttpErrorToast(
  method: string,
  error: HttpErrorResponse,
  url?: string,
): HttpToastMessage {
  const payload = error.error as BackendErrorPayload | string | null;
  const backendMessage = extractBackendErrorMessage(payload);

  if (url) {
    const rule = findEndpointRule(url, method);

    if (rule?.error) {
      return {
        title: rule.error.title,
        message: backendMessage || rule.error.message,
      };
    }
  }

  const key = `${method}:${error.status}` as HttpToastKey;
  const specific = ERROR_BY_KEY[key];
  const byStatus = ERROR_BY_STATUS[error.status];

  if (specific) {
    return {
      title: specific.title,
      message: backendMessage || specific.message,
    };
  }

  if (byStatus) {
    return {
      title: byStatus.title,
      message:
        backendMessage ||
        byStatus.message ||
        error.message ||
        `Error ${error.status}`,
    };
  }

  return {
    title: 'Error',
    message:
      backendMessage ||
      error.message ||
      `Error ${error.status}: ${error.statusText || 'Desconocido'}`,
  };
}
