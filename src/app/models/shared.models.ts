export interface Paginated<T> {
  items: T[];
  nextOffset?: number | null;
}
