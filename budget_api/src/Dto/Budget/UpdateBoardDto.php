<?php

namespace App\Dto\Budget;

use Symfony\Component\Validator\Constraints as Assert;

final class UpdateBoardDto
{
    #[Assert\NotBlank(message: 'Le nom du board est obligatoire.')]
    #[Assert\Length(max: 120, maxMessage: 'Le nom ne peut pas dépasser {{ limit }} caractères.')]
    public string $name = '';

    /**
     * Fusionnés avec les réglages existants (ex. {"rollupDisplay": "detailed"}).
     *
     * @var array<string, mixed>|null
     */
    public ?array $settings = null;
}
