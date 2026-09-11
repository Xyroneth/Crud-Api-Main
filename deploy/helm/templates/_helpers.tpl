{{- define "task-manager-api.name" -}}task-manager-api{{- end }}
{{- define "task-manager-api.fullname" -}}{{ .Release.Name }}-{{ include "task-manager-api.name" . }}{{- end }}
