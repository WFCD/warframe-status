import { DocumentBuilder } from '@nestjs/swagger';
import packageJson from '../../package.json' with { type: 'json' };

export const config = new DocumentBuilder()
  .setTitle('Warframe Status API')
  .setDescription(
    'API for retrieving Warframe worldstate data, items, profiles, and more',
  )
  .setVersion(packageJson.version)
  .setContact(
    'Warframe Community Developers',
    'https://github.com/WFCD/warframe-status',
    'tobiah@warframestat.us',
  )
  .setLicense('Apache-2.0', 'https://www.apache.org/licenses/LICENSE-2.0')
  .addServer('https://api.warframestat.us', 'Production')
  .addServer('http://localhost:3000', 'Local Development')
  .addTag('system', 'System health and status endpoints')
  .addTag(
    'worldstate',
    'Warframe worldstate data - live game events, alerts, invasions, and more',
  )
  .addTag(
    'items',
    'Warframe items database - weapons, warframes, mods, and equipment',
  )
  .addTag('drops', 'Drop tables and loot information')
  .addTag('rivens', 'Riven mod disposition and pricing statistics')
  .addTag('wfinfo', 'WFInfo overlay application integration endpoints')
  .addTag('pricecheck', 'Warframe.market price checking integration')
  .addTag('profile', 'Player profile parsing and statistics')
  .addTag('social', 'Social media feeds - Twitter and RSS')
  .addTag(
    'data',
    'Static Warframe data - synthesis targets, arcanes, tutorials, conclave, sol nodes, and more',
  )
  .addExtension(
    'x-logo',
    {
      url: 'https://docs.warframestat.com/wfcd_logo_color.png',
      backgroundColor: 'transparent',
      altText: 'Warframe Community Developers',
      href: 'https://github.com/WFCD/',
    },
    'info',
  )
  .build();
