import { ApiProperty } from '@nestjs/swagger';

/**
 * RSS feed item data structure
 * Based on rss-feed-emitter RSSItem type
 */
export interface RssFeedItemDataDto {
  title: string;
  description: string;
  summary: string;
  date: Date | null;
  pubdate: Date | null;
  link: string;
  origlink: string;
  author: string;
  guid: string;
  comments: string;
  image: object;
  categories: string;
  enclosures: object;
  meta: object;
  [key: string]: any;
}

/**
 * RSS feed containing URL and items
 */
export class RssFeedItemDto {
  @ApiProperty({
    description: 'RSS feed URL',
    example: 'https://www.warframe.com/news/rss',
    type: String,
  })
  url: string;

  @ApiProperty({
    description: 'Array of RSS feed items',
    type: 'array',
    items: {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'Item title' },
        description: { type: 'string', description: 'Item description' },
        summary: { type: 'string', description: 'Item summary' },
        date: {
          type: 'string',
          format: 'date-time',
          description: 'Item date',
        },
        pubdate: {
          type: 'string',
          format: 'date-time',
          description: 'Published date',
        },
        link: { type: 'string', description: 'Link to item' },
        origlink: { type: 'string', description: 'Original link' },
        author: { type: 'string', description: 'Author' },
        guid: { type: 'string', description: 'Globally unique ID' },
        comments: { type: 'string', description: 'Comments' },
        image: { type: 'object', description: 'Image data' },
        categories: {
          type: 'string',
          description: 'Categories (comma-separated)',
        },
        enclosures: { type: 'object', description: 'Enclosures' },
        meta: { type: 'object', description: 'Metadata' },
      },
    },
  })
  items: RssFeedItemDataDto[];
}

/**
 * Complete RSS feed response
 * Array of RSS feeds with their items
 */
export type RssFeedResponseDto = RssFeedItemDto[];
