import { Observable } from 'rxjs'
import { Injectable } from '@angular/core'
import { Logger, LogService } from 'terminus-core'
import { exec } from 'mz/child_process'
import axios from 'axios'

const NAME_PREFIX = 'terminus-'

export interface IPluginInfo {
    name: string
    description: string
    packageName: string
    isBuiltin: boolean
    version: string
    homepage?: string
    path?: string
}

@Injectable()
export class PluginManagerService {
    logger: Logger
    builtinPluginsPath: string = (window as any).builtinPluginsPath
    userPluginsPath: string = (window as any).userPluginsPath
    installedPlugins: IPluginInfo[] = (window as any).installedPlugins

    constructor (
        log: LogService,
    ) {
        this.logger = log.create('pluginManager')
    }

    listAvailable (query?: string): Observable<IPluginInfo[]> {
        return Observable
            .fromPromise(
                axios.get(`https://www.npmjs.com/-/search?text=${NAME_PREFIX}+${encodeURIComponent(query || '')}&from=0&size=1000`)
            )
            .map(response => response.data.objects.map(item => ({
                name: item.package.name.substring(NAME_PREFIX.length),
                packageName: item.package.name,
                description: item.package.description,
                version: item.package.version,
                homepage: item.package.links.homepage,
            })))
            .map(plugins => plugins.filter(x => x.packageName.startsWith(NAME_PREFIX)))
    }

    async installPlugin (plugin: IPluginInfo) {
        let result = await exec(`npm --prefix "${this.userPluginsPath}" install ${plugin.packageName}@${plugin.version}`)
        console.log(result)
        this.installedPlugins = this.installedPlugins.filter(x => x.packageName !== plugin.packageName)
        this.installedPlugins.push(plugin)
    }

    async uninstallPlugin (plugin: IPluginInfo) {
        await exec(`npm --prefix "${this.userPluginsPath}" remove ${plugin.packageName}`)
        this.installedPlugins = this.installedPlugins.filter(x => x.packageName !== plugin.packageName)
    }
}