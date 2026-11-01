<?php

declare(strict_types=1);

namespace App\Event;

use App\Entity\User;

/**
 * Le compte vient d'être activé (adresse e-mail vérifiée). L'authentification reste indépendante
 * du budget : c'est un listener qui crée le board perso.
 */
final readonly class UserActivatedEvent
{
    public function __construct(public User $user) {}
}
