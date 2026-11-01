<?php

declare(strict_types=1);

namespace App\Security;

use App\Entity\User;

/**
 * Pour les services qui injectent Symfony\Bundle\SecurityBundle\Security dans $this->security.
 */
trait AuthenticatedUserTrait
{
    private function getAuthenticatedUser(): ?User
    {
        $user = $this->security->getUser();

        return $user instanceof User ? $user : null;
    }
}
