import { DocumentBuilder } from '@nestjs/swagger';

export const config = new DocumentBuilder()
  .setTitle('Warframe Status API')
  .setDescription(
    'API for retrieving Warframe worldstate data, items, profiles, and more',
  )
  .setVersion('2.6.44')
  .setContact(
    'Warframe Community Developers',
    'https://github.com/WFCD/warframe-status',
    'tobiah@wfcd.dev',
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
    'synthTargets',
    'Sanctuary synthesis targets and other static Warframe data',
  )
  .addTag(
    'data',
    'Static Warframe data - arcanes, tutorials, conclave, sol nodes, and more',
  )
  .build();
