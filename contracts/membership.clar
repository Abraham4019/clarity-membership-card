;; Define the membership card contract
(define-non-fungible-token membership-card uint)

;; Constants
(define-constant contract-owner tx-sender)
(define-constant err-owner-only (err u100))
(define-constant err-already-exists (err u101))
(define-constant err-not-found (err u102))
(define-constant err-expired (err u103))
(define-constant err-unauthorized (err u104))

;; Data vars
(define-map memberships
    uint
    {
        owner: principal,
        membership-type: (string-ascii 20),
        expiry: uint,
        active: bool
    }
)

(define-data-var next-id uint u1)

;; Issue new membership card
(define-public (issue-membership (recipient principal) (membership-type (string-ascii 20)) (validity-period uint))
    (let 
        (
            (card-id (var-get next-id))
            (expiry-date (+ block-height validity-period))
        )
        (if (is-eq tx-sender contract-owner)
            (begin
                (try! (nft-mint? membership-card card-id recipient))
                (map-set memberships card-id {
                    owner: recipient,
                    membership-type: membership-type,
                    expiry: expiry-date,
                    active: true
                })
                (var-set next-id (+ card-id u1))
                (ok card-id)
            )
            err-owner-only
        )
    )
)

;; Check membership status
(define-read-only (get-membership (card-id uint))
    (match (map-get? memberships card-id)
        membership (ok membership)
        err-not-found
    )
)

;; Verify membership validity
(define-read-only (is-valid-member (card-id uint))
    (match (map-get? memberships card-id)
        membership (if (and 
                        (get active membership)
                        (<= block-height (get expiry membership))
                    )
                    (ok true)
                    err-expired
                )
        err-not-found
    )
)

;; Revoke membership
(define-public (revoke-membership (card-id uint))
    (let (
        (membership (unwrap! (map-get? memberships card-id) err-not-found))
    )
        (if (is-eq tx-sender contract-owner)
            (begin
                (try! (nft-burn? membership-card card-id (get owner membership)))
                (map-set memberships card-id 
                    (merge membership { active: false })
                )
                (ok true)
            )
            err-owner-only
        )
    )
)

;; Transfer membership
(define-public (transfer-membership (card-id uint) (recipient principal))
    (let (
        (membership (unwrap! (map-get? memberships card-id) err-not-found))
    )
        (if (and
                (is-eq tx-sender (get owner membership))
                (get active membership)
            )
            (begin
                (try! (nft-transfer? membership-card card-id tx-sender recipient))
                (map-set memberships card-id 
                    (merge membership { owner: recipient })
                )
                (ok true)
            )
            err-unauthorized
        )
    )
)
