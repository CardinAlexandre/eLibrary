# 🔧 Dépannage - Permission denied SSH

## Problème : Permission denied (publickey,password)

Cette erreur signifie que la clé SSH dans GitHub Secrets n'est pas autorisée sur le Raspberry Pi.

## 🔍 Diagnostic

### Étape 1 : Vérifier sur le Raspberry Pi

Connectez-vous au Raspberry Pi et exécutez :

```bash
# Se connecter en SSH avec mot de passe
ssh pi@RASPBERRY_PI_IP
# ou
ssh deploy@RASPBERRY_PI_IP

# Une fois connecté, vérifier les clés autorisées
cat ~/.ssh/authorized_keys

# Vérifier les permissions
ls -la ~/.ssh/
```

**Permissions correctes attendues :**
```
drwx------  2 deploy deploy 4096 ... .ssh/
-rw-------  1 deploy deploy  XXX ... authorized_keys
```

### Étape 2 : Générer et configurer la clé SSH

#### Solution A : Utiliser le script automatique

```bash
# Sur le Raspberry Pi
cd /tmp
wget https://raw.githubusercontent.com/VOTRE_USERNAME/eLibrary/main/raspberry-pi/scripts/setup-pi.sh
bash setup-pi.sh
```

Le script affiche automatiquement la clé privée à copier dans GitHub Secrets.

#### Solution B : Configuration manuelle

```bash
# 1. Sur le Raspberry Pi, générer une nouvelle clé
ssh-keygen -t ed25519 -C "github-actions" -f ~/.ssh/github_deploy -N ""

# 2. Ajouter la clé publique aux autorisations
cat ~/.ssh/github_deploy.pub >> ~/.ssh/authorized_keys

# 3. Vérifier les permissions
chmod 700 ~/.ssh
chmod 600 ~/.ssh/authorized_keys
chmod 600 ~/.ssh/github_deploy

# 4. Afficher la clé PRIVÉE (à copier dans GitHub Secrets)
cat ~/.ssh/github_deploy
```

**⚠️ IMPORTANT** : Copiez **TOUTE** la clé privée, y compris :
```
-----BEGIN OPENSSH PRIVATE KEY-----
...
(toutes les lignes)
...
-----END OPENSSH PRIVATE KEY-----
```

### Étape 3 : Mettre à jour le secret GitHub

1. Aller dans **Settings → Secrets and variables → Actions → Environments → eLibrary**
2. Trouver **RASPBERRY_PI_SSH_KEY**
3. Cliquer sur **Update**
4. Coller la **clé privée complète**
5. Sauvegarder

### Étape 4 : Tester la connexion SSH localement

```bash
# Sur votre machine de développement
# Sauvegarder la clé privée dans un fichier temporaire
nano /tmp/test_key
# Coller la clé privée
chmod 600 /tmp/test_key

# Tester la connexion
ssh -i /tmp/test_key deploy@RASPBERRY_PI_IP "echo 'Connection OK'"

# Si ça fonctionne, la clé est bonne !
# Nettoyer
rm /tmp/test_key
```

## 🐛 Problèmes courants

### Erreur : "Invalid format"

**Cause** : La clé n'est pas copiée entièrement

**Solution** :
- Assurez-vous de copier **toute** la clé
- Inclure les lignes BEGIN et END
- Ne pas ajouter d'espaces ou de retours à la ligne supplémentaires

### Erreur : "Bad owner or permissions"

**Cause** : Mauvaises permissions sur le Raspberry Pi

**Solution** :
```bash
# Sur le Raspberry Pi
chmod 700 ~/.ssh
chmod 600 ~/.ssh/authorized_keys
chmod 600 ~/.ssh/github_deploy  # ou le nom de votre clé
```

### Erreur : "Connection refused"

**Cause** : SSH n'est pas activé ou le Pi n'est pas accessible

**Solution** :
```bash
# Vérifier que SSH est actif
sudo systemctl status ssh

# Si pas actif, l'activer
sudo systemctl enable ssh
sudo systemctl start ssh

# Vérifier le pare-feu
sudo ufw status
# Si SSH est bloqué
sudo ufw allow 22/tcp
```

### L'utilisateur n'existe pas

**Cause** : L'utilisateur configuré dans `RASPBERRY_PI_USER` n'existe pas

**Solution** :
```bash
# Créer l'utilisateur deploy
sudo adduser deploy
sudo usermod -aG docker deploy
sudo usermod -aG sudo deploy

# Se connecter avec le nouvel utilisateur
su - deploy

# Créer le dossier SSH
mkdir -p ~/.ssh
chmod 700 ~/.ssh
```

## ✅ Checklist de vérification

Avant de relancer le workflow, vérifier :

- [ ] L'utilisateur existe sur le Raspberry Pi (deploy ou pi)
- [ ] Le dossier `~/.ssh` existe avec permissions 700
- [ ] Le fichier `authorized_keys` existe avec permissions 600
- [ ] La clé publique est bien dans `authorized_keys`
- [ ] La clé privée COMPLÈTE est dans GitHub Secrets (BEGIN + contenu + END)
- [ ] Le secret `RASPBERRY_PI_USER` correspond à l'utilisateur réel
- [ ] Le secret `RASPBERRY_PI_HOST` contient l'IP correcte
- [ ] Le Raspberry Pi est allumé et accessible sur le réseau
- [ ] SSH est actif sur le Raspberry Pi

## 🧪 Test rapide

```bash
# Sur le Raspberry Pi
echo "Test de configuration SSH"
echo "User: $(whoami)"
echo "Home: $HOME"
echo "SSH dir: $(ls -ld ~/.ssh 2>/dev/null || echo 'NOT FOUND')"
echo "Authorized keys: $(wc -l < ~/.ssh/authorized_keys 2>/dev/null || echo '0') keys"
echo "Permissions: $(stat -c '%a' ~/.ssh/authorized_keys 2>/dev/null || echo 'N/A')"
```

**Résultat attendu :**
```
Test de configuration SSH
User: deploy
Home: /home/deploy
SSH dir: drwx------ 2 deploy deploy 4096 ... /home/deploy/.ssh
Authorized keys: 1 keys  (ou plus)
Permissions: 600
```

## 📞 Encore bloqué ?

Si le problème persiste après avoir suivi ces étapes :

1. Vérifier les logs SSH sur le Raspberry Pi :
```bash
sudo tail -f /var/log/auth.log
# Dans un autre terminal, lancer le workflow et observer les logs
```

2. Tester avec une connexion SSH normale (mot de passe) :
```bash
# Si vous pouvez vous connecter avec mot de passe mais pas avec la clé,
# le problème vient de la clé ou des permissions
```

3. Régénérer complètement la clé :
```bash
# Supprimer l'ancienne
rm ~/.ssh/github_deploy*

# Regénérer
ssh-keygen -t ed25519 -f ~/.ssh/github_deploy -N ""
cat ~/.ssh/github_deploy.pub >> ~/.ssh/authorized_keys

# Mettre à jour GitHub Secrets avec la nouvelle clé privée
cat ~/.ssh/github_deploy
```

