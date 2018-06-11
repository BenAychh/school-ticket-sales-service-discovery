export interface IEndpoint {
  color: 'blue' | 'green';
  duration: number;
  updatedAt: Date;
  urls: {
    blue: string;
    green: string;
  };
}
