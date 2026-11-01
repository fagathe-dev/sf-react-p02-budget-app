<?php

namespace App\Dto\Account;

use Symfony\Component\HttpFoundation\File\UploadedFile;
use Symfony\Component\Validator\Constraints as Assert;

final class UploadAvatarDto
{
    public function __construct(
        #[Assert\NotNull(message: 'Veuillez sélectionner une image.')]
        #[Assert\File(
            maxSize: '5M',
            mimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
            maxSizeMessage: 'L\'image ne doit pas dépasser 5 Mo.',
            mimeTypesMessage: 'Seuls les formats JPG, PNG, WEBP et GIF sont acceptés.'
        )]
        public readonly ?UploadedFile $file = null,
    ) {}
}
