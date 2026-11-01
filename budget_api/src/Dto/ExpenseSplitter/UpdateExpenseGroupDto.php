<?php

namespace App\Dto\ExpenseSplitter;

use Symfony\Component\Validator\Constraints as Assert;

final class UpdateExpenseGroupDto
{
    #[Assert\NotBlank(message: 'Le nom du groupe est obligatoire.')]
    #[Assert\Length(max: 120, maxMessage: 'Le nom ne peut pas dépasser {{ limit }} caractères.')]
    public string $name = '';
}
