import {atomFamily, selectorFamily, useRecoilState} from "recoil"
import {fetchKaratsBalance} from "../flow/fetch-karats-balance.script"
import {IDLE, PROCESSING} from "../global/constants"

export const valueAtom = atomFamily({
  key: "karats-balance::state",
  default: selectorFamily({
    key: "karats-balance::default",
    get: address => async () => fetchKaratsBalance(address),
  }),
})

export const statusAtom = atomFamily({
  key: "karats-balance::status",
  default: IDLE,
})

export function useKaratsBalance(address) {
  const [balance, setBalance] = useRecoilState(valueAtom(address))
  const [status, setStatus] = useRecoilState(statusAtom(address))

  async function refresh() {
    setStatus(PROCESSING)
    await fetchKaratsBalance(address).then(setBalance)
    setStatus(IDLE)
  }

  return {
    balance,
    status,
    refresh,
    async mint() {
      setStatus(PROCESSING)
      await fetch(process.env.REACT_APP_API_KARAT_MINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          recipient: address,
          amount: 50.0,
        }),
      })
      await fetchKaratsBalance(address).then(setBalance)
      setStatus(IDLE)
    },
  }
}