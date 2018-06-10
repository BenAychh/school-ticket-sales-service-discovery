export interface IEndpoint {
  color: 'blue' | 'green';
  updatedAt: Date;
  duration: number;
  urls: {
    blue: string;
    green: string;
  };
}
