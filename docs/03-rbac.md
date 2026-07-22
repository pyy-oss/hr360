# 03 — RBAC (contrôle d'accès basé sur les rôles)

## Rôles
| Rôle | Description | Portée |
|---|---|---|
| `super_admin` | Administration technique, gestion des rôles | Tout |
| `drh` | Direction RH — administration fonctionnelle complète | Toute l'organisation |
| `rh` | Chargé RH — opérations quotidiennes | Toute l'organisation (hors config) |
| `manager` | Responsable d'équipe | Son **département** |
| `collaborateur` | Salarié | **Ses** propres données |
| `lecture` | Audit / consultation | Lecture seule |

## Où vit le rôle
Le rôle et le rattachement font autorité dans les **custom claims** du token Firebase :
```json
{ "role": "manager", "orgId": "neurones", "departmentId": "cyber", "employeeId": "e_123" }
```
Ils sont posés par la fonction admin `setUserRole` (réservée `super_admin`/`drh`) et lus
par les règles Firestore via `request.auth.token`. Le champ `role` dans `users/{uid}`
n'est qu'un reflet d'affichage — il ne fait pas autorité.

## Matrice de permissions (résumé)
Ressource → actions autorisées par rôle. `own` = ses propres données ; `dept` = son département.

| Ressource | super_admin | drh | rh | manager | collaborateur | lecture |
|---|---|---|---|---|---|---|
| employees | CRUD | CRUD | CRU | R (dept) | R (own) | R |
| leaveRequests | CRUD+approve | CRUD+approve | RU+approve | R(dept)+approve(dept) | CR (own) | R |
| leaveBalances | RU | RU | R | R (dept) | R (own) | R |
| trainingNeeds/Plans | CRUD | CRUD | CRU | CRU (dept) | R (own) | R |
| enrollments | CRUD | CRUD | CRU | RU (dept) | R (own) | R |
| objectiveCampaigns | CRUD | CRUD | R | R | R | R |
| objectives | CRUD | CRUD | RU | CRU (dept) | RU (own) | R |
| evaluations | CRUD | CRUD | RU | CRU (dept) | R (own, si publiée) | R |
| roles / settings | CRUD | RU | — | — | — | R |
| auditLogs | R | R | — | — | — | R |

> Les décisions (approuver un congé, clôturer une campagne, publier une évaluation) ne
> passent **jamais** par une écriture directe : elles transitent par une Cloud Function
> qui revalide cette matrice et écrit l'audit.

## Implémentation
1. **Custom claims** — `functions/src/auth/setUserRole.ts` (onCall, `super_admin`/`drh`).
2. **Règles Firestore** — `firestore.rules` : helpers `role()`, `hasAny()`, `isSelf()`,
   `isDeptManager()`, plus les règles par collection.
3. **Cloud Functions** — `functions/src/lib/rbac.ts` : `assertRole()`, `assertDeptManager()`.
4. **Frontend** — `src/lib/rbac.ts` (matrice `can()`) + `src/auth/RequirePermission.tsx`
   (garde de rendu). **UX uniquement** — ne protège rien à elle seule.

## Règle de synchronisation
Après `setUserRole`, le client doit rafraîchir son token (`getIdToken(true)`) pour que
les nouveaux claims prennent effet.
