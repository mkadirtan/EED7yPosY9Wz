import { Table, Column, Model } from 'sequelize-typescript';

interface Blog {
  id: string;
  title: string;
  content: string;
  excerpt: string;
  image: string; // filename.ext
  viewCount: number;
}

@Table({ tableName: 'blog', createdAt: false, updatedAt: false })
export class BlogModel extends Model<Omit<Blog, 'view_count'>, Blog> implements Blog {
  @Column({ primaryKey: true })
  id: string;

  @Column
  title: string;

  @Column
  content: string;

  @Column
  excerpt: string;

  @Column
  image: string;

  @Column
  viewCount: number;
}
