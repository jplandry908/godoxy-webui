import * as AccessLog from './config/access_log'
import * as ACL from './config/acl'
import * as Autocert from './config/autocert'
import * as Config from './config/config'
import * as Entrypoint from './config/entrypoint'
import * as Maxmind from './config/maxmind'
import * as Notification from './config/notification'
import * as Providers from './config/providers'

import * as MiddlewareCompose from './middlewares/middleware_compose'
import * as Middlewares from './middlewares/middlewares'

import * as Healthcheck from './providers/healthcheck'
import * as Homepage from './providers/homepage'
import * as IdleWatcher from './providers/idlewatcher'
import * as LoadBalance from './providers/loadbalance'
import * as Proxmox from './providers/proxmox'
import * as Routes from './providers/routes'

import * as GoDoxy from './types'

import ACLSchema from './acl.schema.json'
import AutocertSchema from './autocert.schema.json'
import ConfigSchema from './config.schema.json'
import DockerRoutesSchema from './docker_routes.schema.json'
import EntrypointMiddlewaresSchema from './entrypoint_middlewares.schema.json'
import MaxmindSchema from './maxmind.schema.json'
import MiddlewareComposeSchema from './middleware_compose.schema.json'
import RoutesSchema from './routes.schema.json'

export {
  AccessLog,
  ACL,
  ACLSchema,
  Autocert,
  AutocertSchema,
  Config,
  ConfigSchema,
  DockerRoutesSchema,
  Entrypoint,
  EntrypointMiddlewaresSchema,
  GoDoxy,
  Healthcheck,
  Homepage,
  IdleWatcher,
  LoadBalance,
  Maxmind,
  MaxmindSchema,
  MiddlewareCompose,
  MiddlewareComposeSchema,
  Middlewares,
  Notification,
  Providers,
  Proxmox,
  Routes,
  RoutesSchema,
}
