// todo отправитть запрос на бэк что чел имеет право заклеймить
export async function allowed(): Promise<Boolean> {
  return true;
}
// заминтить нфт челу
export async function mint(to: string, payload: string) {}
