<?php

declare(strict_types=1);

namespace Primed\Database;

use PDO;
use RuntimeException;

/**
 * Applies forward-only SQL migrations (migrations/NNN_name.sql) in order.
 * Each file records itself in schema_migrations, so manual runs via phpMyAdmin stay consistent.
 */
final class Migrator
{
    public function __construct(private readonly PDO $pdo, private readonly string $directory)
    {
    }

    /**
     * @return list<string> versions applied in this run
     */
    public function migrate(): array
    {
        $applied = $this->appliedVersions();
        $done = [];

        foreach ($this->availableVersions() as $version => $file) {
            if (in_array($version, $applied, true)) {
                continue;
            }
            foreach (self::statements($this->read($file)) as $statement) {
                $this->pdo->exec($statement);
            }
            if (!in_array($version, $this->appliedVersions(), true)) {
                throw new RuntimeException(sprintf('Migration %s did not record itself', $version));
            }
            $done[] = $version;
        }

        return $done;
    }

    /**
     * @return array<string, string> version => file path, sorted
     */
    public function availableVersions(): array
    {
        $files = glob($this->directory . '/[0-9][0-9][0-9]_*.sql');
        if ($files === false) {
            return [];
        }
        sort($files, SORT_STRING);

        $versions = [];
        foreach ($files as $file) {
            $versions[basename($file, '.sql')] = $file;
        }

        return $versions;
    }

    /**
     * @return list<string>
     */
    public function appliedVersions(): array
    {
        $exists = $this->pdo->query("SHOW TABLES LIKE 'schema_migrations'");
        if ($exists === false || $exists->fetchColumn() === false) {
            return [];
        }

        $result = $this->pdo->query('SELECT version FROM schema_migrations ORDER BY version');
        if ($result === false) {
            return [];
        }

        $versions = [];
        foreach ($result->fetchAll(PDO::FETCH_COLUMN) as $version) {
            if (is_string($version)) {
                $versions[] = $version;
            }
        }

        return $versions;
    }

    /**
     * Splits a migration file into statements: full-line '--' comments are removed,
     * statements end with ';' at the end of a line.
     *
     * @return list<string>
     */
    public static function statements(string $sql): array
    {
        $lines = [];
        $rawLines = preg_split('/\R/', $sql);
        foreach ($rawLines === false ? [] : $rawLines as $line) {
            if (str_starts_with(ltrim($line), '--')) {
                continue;
            }
            $lines[] = $line;
        }

        $statements = [];
        $chunks = preg_split('/;[ \t]*(?:\R|$)/', implode("\n", $lines));
        foreach ($chunks === false ? [] : $chunks as $chunk) {
            $statement = trim($chunk);
            if ($statement !== '') {
                $statements[] = $statement;
            }
        }

        return $statements;
    }

    private function read(string $file): string
    {
        $sql = file_get_contents($file);
        if ($sql === false) {
            throw new RuntimeException('Could not read migration ' . basename($file));
        }

        return $sql;
    }
}
