import { rechercherMetiers, getMetierById } from '../data-loader'

describe('rechercherMetiers', () => {
  it('retourne des résultats pour un terme connu', () => {
    const resultats = rechercherMetiers('infirmier')
    expect(resultats.length).toBeGreaterThan(0)
    expect(resultats[0].nom.toLowerCase()).toContain('infirmier')
  })

  it('retourne un tableau vide si aucune correspondance', () => {
    expect(rechercherMetiers('xyzabc123inexistant')).toHaveLength(0)
  })

  it('est insensible à la casse', () => {
    expect(rechercherMetiers('INFIRMIER').length).toBeGreaterThan(0)
  })

  it('retourne un tableau vide pour une requête vide', () => {
    expect(rechercherMetiers('')).toHaveLength(0)
  })
})

describe('getMetierById', () => {
  it("retourne le métier correspondant à l'id", () => {
    const metier = getMetierById('infirmier')
    expect(metier).not.toBeNull()
    expect(metier?.id).toBe('infirmier')
  })

  it('retourne null pour un id inconnu', () => {
    expect(getMetierById('id-qui-nexiste-pas')).toBeNull()
  })
})
