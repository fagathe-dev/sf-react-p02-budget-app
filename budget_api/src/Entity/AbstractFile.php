<?php

namespace App\Entity;

use Doctrine\ORM\Mapping as ORM;
use Fagathe\CorePhp\File\FileTypeEnum;
use Symfony\Bridge\Doctrine\Types\UuidType;
use Symfony\Component\Serializer\Attribute\Groups;
use Symfony\Component\Uid\Uuid;

#[ORM\MappedSuperclass]
abstract class AbstractFile
{
    #[ORM\Id]
    #[ORM\Column(type: UuidType::NAME, unique: true)]
    #[Groups(['file.read'])]
    protected ?Uuid $id = null;

    #[ORM\Column(length: 255)]
    #[Groups(['file.read'])]
    protected ?string $originalName = null;

    #[ORM\Column(length: 255, nullable: true)]
    #[Groups(['file.read'])]
    protected ?string $niceName = null;

    #[ORM\Column(length: 255)]
    #[Groups(['file.read'])]
    protected ?string $filePath = null;

    #[ORM\Column(length: 100)]
    #[Groups(['file.read'])]
    protected ?string $mimeType = null;

    #[ORM\Column(length: 30, nullable: true, enumType: FileTypeEnum::class)]
    #[Groups(['file.read'])]
    protected FileTypeEnum|string|null $type = null;

    #[ORM\Column(length: 10)]
    #[Groups(['file.read'])]
    protected ?string $extension = null;

    #[ORM\Column]
    #[Groups(['file.read'])]
    protected ?int $size = null;

    #[ORM\Column]
    #[Groups(['file.read'])]
    protected ?\DateTimeImmutable $createdAt = null;

    #[ORM\Column(nullable: true)]
    #[Groups(['file.read'])]
    protected ?\DateTimeImmutable $updatedAt = null;

    #[ORM\Column(options: ['default' => false])]
    #[Groups(['file.read'])]
    protected bool $isPinned = false;

    public function __construct()
    {
        $this->id = Uuid::v7();
        $this->createdAt = new \DateTimeImmutable();
    }

    public function getId(): ?Uuid
    {
        return $this->id;
    }

    public function getOriginalName(): ?string
    {
        return $this->originalName;
    }

    public function setOriginalName(string $originalName): static
    {
        $this->originalName = $originalName;
        return $this;
    }

    public function getNiceName(): ?string
    {
        return $this->niceName;
    }

    public function setNiceName(?string $niceName): static
    {
        $this->niceName = $niceName;
        return $this;
    }

    public function getFilePath(): ?string
    {
        return $this->filePath;
    }

    public function setFilePath(string $filePath): static
    {
        $this->filePath = $filePath;
        return $this;
    }

    public function getMimeType(): ?string
    {
        return $this->mimeType;
    }

    public function setMimeType(string $mimeType): static
    {
        $this->mimeType = $mimeType;
        return $this;
    }

    public function getExtension(): ?string
    {
        return $this->extension;
    }

    public function setExtension(string $extension): static
    {
        $this->extension = $extension;
        return $this;
    }

    public function getSize(): ?int
    {
        return $this->size;
    }

    public function setSize(int $size): static
    {
        $this->size = $size;
        return $this;
    }

    public function getCreatedAt(): ?\DateTimeImmutable
    {
        return $this->createdAt;
    }

    public function setCreatedAt(\DateTimeImmutable $createdAt): static
    {
        $this->createdAt = $createdAt;
        return $this;
    }

    public function getUpdatedAt(): ?\DateTimeImmutable
    {
        return $this->updatedAt;
    }

    public function setUpdatedAt(?\DateTimeImmutable $updatedAt): static
    {
        $this->updatedAt = $updatedAt;
        return $this;
    }

    public function isPinned(): bool
    {
        return $this->isPinned;
    }

    public function setIsPinned(bool $isPinned): static
    {
        $this->isPinned = $isPinned;
        return $this;
    }

    public function getType(): ?FileTypeEnum
    {
        return $this->type;
    }

    public function setType(FileTypeEnum|string|null $type): static
    {
        if (is_string($type)) {
            $type = FileTypeEnum::tryFrom($type);
        }
        $this->type = $type;
        return $this;
    }
}