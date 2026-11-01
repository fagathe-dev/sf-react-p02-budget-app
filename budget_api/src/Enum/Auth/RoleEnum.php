<?php

namespace App\Enum\Auth;

enum RoleEnum: string
{
    case RoleUser = 'ROLE_USER';
    case RoleAdmin = 'ROLE_ADMIN';

    /**
     * @param null|string|RoleEnum|null $role
     * 
     * @return string
     */
    public static function getRole(null|string|RoleEnum $role = null): string
    {
        if (is_string($role)) {
            $role = RoleEnum::tryFrom($role);
        }
        if ($role instanceof RoleEnum === false || $role === null) {
            return 'Tous les rôles';
        }

        return static::mapRole($role);
    }

    /**
     * @param RoleEnum $role
     * 
     * @return string
     */
    public static function mapRole(RoleEnum $role): string
    {
        return match ($role) {
            static::RoleUser => 'Utilisateur',
            static::RoleAdmin => 'Administrateur',
        };
    }

    /**
     * @return array
     */
    public static function choices(): array
    {
        return [
            'Utilisateur' => static::RoleUser->value,
            'Administrateur' => static::RoleAdmin->value,
        ];
    }

    /**
     * @return array
     */
    public static function values(): array
    {
        return array_map(fn($e) => $e->value, self::cases());
    }
}
