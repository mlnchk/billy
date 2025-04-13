import { Bill } from "../types.ts";

// TODO: make it generic
type KV = KVNamespace;

// Bill Storage
export const createStorageService = ({ kv }: { kv: KV }) => {
  async function storeBill(
    chatId: number,
    messageId: number,
    bill: Bill,
  ): Promise<void> {
    await kv.put(
      ["bill", chatId.toString(), messageId.toString()].join("-"),
      JSON.stringify(bill),
    );
  }

  async function getBill(
    chatId: number,
    messageId: number,
  ): Promise<Bill | null> {
    const result = await kv.get<Bill>(
      ["bill", chatId.toString(), messageId.toString()].join("-"),
      "json",
    );
    return result;
  }

  // Vote Storage
  async function storeVote(
    chatId: number,
    messageId: number,
    userId: string,
    votes: number[],
  ): Promise<void> {
    await kv.put(
      ["votes", chatId.toString(), messageId.toString(), userId].join("-"),
      JSON.stringify(votes),
    );
  }

  async function getVotes(
    chatId: number,
    messageId: number,
  ): Promise<Map<string, number[]>> {
    const votes = new Map<string, number[]>();
    const votesPrefix = ["votes", chatId.toString(), messageId.toString()].join(
      "-",
    );
    const { keys } = await kv.list<number[]>({ prefix: votesPrefix });

    for (const key of keys) {
      // FIXME: завязались на индекс ключа
      const userId = key.name.split("-")[3] as string;
      const currentVotes = await kv.get<number[]>(key.name, "json");

      if (currentVotes) {
        votes.set(userId, currentVotes);
      }
    }

    return votes;
  }

  return {
    storeBill,
    getBill,
    storeVote,
    getVotes,
  };
};

export type StorageService = ReturnType<typeof createStorageService>;
